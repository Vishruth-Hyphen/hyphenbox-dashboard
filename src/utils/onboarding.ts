import { supabase } from '../lib/supabase'; // Corrected import path
import { type CursorFlow } from './cursorflows'; // Reusing CursorFlow type

export interface OnboardingChecklist {
  id: string;
  organization_id: string;
  name: string;
  title_text: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  appearance_settings: Record<string, any> | null; // JSONB
  created_at: string;
  updated_at: string;
}

export interface OnboardingChecklistFlowItem {
  id: string; // This would be the id of the onboarding_checklist_flows record
  checklist_id: string;
  flow_id: string;
  position: number;
  cursor_flows?: Pick<CursorFlow, 'id' | 'name' | 'status'>[]; // Changed to expect an array from Supabase join
}

const DEFAULT_ONBOARDING_CHECKLIST_NAME = 'Default Onboarding';

/**
 * Fetches the active onboarding checklist for an organization.
 * If multiple active, returns the most recently created one.
 * If none active, it creates a default one.
 */
export async function getOrCreateDefaultOnboardingChecklist(organizationId: string): Promise<{ checklist: OnboardingChecklist | null; error: any | null }> {
  if (!organizationId) return { checklist: null, error: 'Organization ID is required' };

  try {
    // 1. Try to find any existing checklist for the org, get the most recent one.
    let { data: existingChecklists, error: fetchError } = await supabase
      .from('onboarding_checklists')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (existingChecklists && existingChecklists.length > 0) {
      const checklistToUse = existingChecklists[0];
      // Ensure it's active and has a default name/title, update if necessary
      if (!checklistToUse.is_active || checklistToUse.name !== DEFAULT_ONBOARDING_CHECKLIST_NAME || !checklistToUse.title_text) {
        const { data: updated, error: updateError } = await supabase
          .from('onboarding_checklists')
          .update({ 
            is_active: true, 
            name: DEFAULT_ONBOARDING_CHECKLIST_NAME, 
            title_text: checklistToUse.title_text || 'Welcome to our App!', // Keep existing title if present, else default
            description: checklistToUse.description || 'Follow these steps to get started.', // Keep existing description or default
            appearance_settings: checklistToUse.appearance_settings || {} // Keep existing settings or empty object
          })
          .eq('id', checklistToUse.id)
          .select()
          .single();
        if (updateError) throw updateError;
        return { checklist: updated as OnboardingChecklist, error: null };
      }
      return { checklist: checklistToUse as OnboardingChecklist, error: null };
    }

    // 2. If no checklist exists at all for the org, create a new default one
    const { data: newChecklist, error: createError } = await supabase
      .from('onboarding_checklists')
      .insert({
        organization_id: organizationId,
        name: DEFAULT_ONBOARDING_CHECKLIST_NAME,
        title_text: 'Welcome to our App!',
        description: 'Follow these steps to get started.',
        is_active: true,
        appearance_settings: {}
      })
      .select()
      .single();

    if (createError) throw createError;
    return { checklist: newChecklist as OnboardingChecklist, error: null };

  } catch (error) {
    console.error('[OnboardingUtils] Error in getOrCreateDefaultOnboardingChecklist:', error);
    return { checklist: null, error };
  }
}

/**
 * Fetches a specific onboarding checklist along with its associated flows (names and order).
 */
export async function getOnboardingChecklistWithFlows(checklistId: string): Promise<{ 
    checklist: OnboardingChecklist | null; 
    flows: OnboardingChecklistFlowItem[] | null;
    error: any | null; 
}> {
  if (!checklistId) return { checklist: null, flows: null, error: 'Checklist ID is required' };

  try {
    // 1. First, get the checklist data
    const { data: checklistData, error: checklistError } = await supabase
      .from('onboarding_checklists')
      .select('*')
      .eq('id', checklistId)
      .single();

    if (checklistError) throw checklistError;
    if (!checklistData) return { checklist: null, flows: null, error: 'Checklist not found' };

    // 2. Then get the checklist flows with proper foreign key relationship
    const { data: checklistFlowsData, error: flowsError } = await supabase
      .from('onboarding_checklist_flows')
      .select(`
        id,
        checklist_id,
        flow_id,
        position,
        cursor_flows!flow_id (id, name, status)
      `)
      .eq('checklist_id', checklistId)
      .order('position', { ascending: true });

    if (flowsError) throw flowsError;

    // 3. Process the data, ensuring proper type handling
    const processedFlows = checklistFlowsData.map(item => {
      // Make sure cursor_flows is treated as an array even when it's a single object
      let flowsArray = item.cursor_flows;
      if (flowsArray && !Array.isArray(flowsArray)) {
        flowsArray = [flowsArray];
      }
      
      return {
        ...item,
        cursor_flows: (flowsArray || []) as Pick<CursorFlow, 'id' | 'name' | 'status'>[]
      };
    });

    return { 
        checklist: checklistData as OnboardingChecklist, 
        flows: processedFlows as OnboardingChecklistFlowItem[], 
        error: null 
    };
  } catch (error) {
    console.error('[OnboardingUtils] Error in getOnboardingChecklistWithFlows:', error);
    return { checklist: null, flows: null, error };
  }
}

/**
 * Updates the flows associated with an onboarding checklist.
 * This will replace all existing flows for the checklist with the new set.
 */
export async function updateOnboardingChecklistFlows(
  checklistId: string, 
  flowItems: Array<{ flow_id: string; position: number }>
): Promise<{ success: boolean; error: any | null }> {
  if (!checklistId) return { success: false, error: 'Checklist ID is required' };

  try {
    // Perform operations in a transaction if possible, or ensure atomicity if your Supabase client supports it easily.
    // For now, simple delete then insert.
    const { error: deleteError } = await supabase
      .from('onboarding_checklist_flows')
      .delete()
      .eq('checklist_id', checklistId);

    if (deleteError) throw deleteError;

    if (flowItems.length > 0) {
      const itemsToInsert = flowItems.map(item => ({
        checklist_id: checklistId,
        flow_id: item.flow_id,
        position: item.position
      }));
      const { error: insertError } = await supabase
        .from('onboarding_checklist_flows')
        .insert(itemsToInsert);
      if (insertError) throw insertError;
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('[OnboardingUtils] Error in updateOnboardingChecklistFlows:', error);
    return { success: false, error };
  }
}

/**
 * Updates the details (name, title, appearance, active status) of an onboarding checklist.
 */
export async function updateOnboardingChecklistDetails(
  checklistId: string, 
  details: Partial<Pick<OnboardingChecklist, 'name' | 'title_text' | 'description' | 'logo_url' | 'appearance_settings' | 'is_active'>>
): Promise<{ checklist: OnboardingChecklist | null; error: any | null }> {
  if (!checklistId) return { checklist: null, error: 'Checklist ID is required' };
  if (Object.keys(details).length === 0) return { checklist: null, error: 'No details provided to update' }; // Or return current if no changes

  try {
    const { data: updatedChecklist, error } = await supabase
      .from('onboarding_checklists')
      .update(details)
      .eq('id', checklistId)
      .select()
      .single();

    if (error) throw error;
    return { checklist: updatedChecklist as OnboardingChecklist, error: null };
  } catch (error) {
    console.error('[OnboardingUtils] Error in updateOnboardingChecklistDetails:', error);
    return { checklist: null, error };
  }
} 