import { supabase, type CursorFlow } from "../lib/supabase";
import { type CursorFlowData } from "./cursorflows";

export interface AudienceData {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * Fix user ID format by removing the 'y' prefix if present
 * @param userId - The user ID from the database
 * @returns Properly formatted UUID
 */
const formatUserId = (userId: string): string => {
  // If the ID starts with 'y', remove it
  if (userId.startsWith('y')) {
    return userId.substring(1);
  }
  return userId;
};

/**
 * Fetch all audiences from the database
 * @param organizationId - Optional organization ID to filter by
 * @returns Promise with the fetched audiences
 */
export const fetchAudiences = async (
  organizationId?: string
): Promise<{
  data: AudienceData[] | null;
  error: any;
}> => {
  try {
    let query = supabase.from('audiences').select('*');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Error in fetchAudiences:', error);
    return { data: null, error };
  }
};

/**
 * Fetch cursor flows associated with an audience
 * @param audienceId - The ID of the audience
 * @returns Promise with the cursor flows
 */
export async function fetchAudienceCursorFlows(audienceId: string) {
  try {
    const { data, error } = await supabase
      .from('audience_flows')
      .select(`
        flow_id,
        cursor_flows (
          id,
          name,
          description,
          status,
          organization_id,
          created_at,
          updated_at,
          created_by,
          published_at,
          published_by
        )
      `)
      .eq('audience_id', audienceId);
    
    if (error) {
      console.error('Error fetching audience cursor flows:', error);
      return { data: null, error: error.message };
    }
    
    // Transform the data to extract cursor_flows from the nested structure
    const flowsData = data.map(item => item.cursor_flows);
    
    return { data: flowsData, error: null };
  } catch (err) {
    console.error('Exception fetching audience cursor flows:', err);
    return { data: null, error: 'Failed to fetch audience cursor flows' };
  }
}

/**
 * Fetch cursor flows count for each audience
 * @param audienceIds - Array of audience IDs
 * @returns Promise with the audience IDs and their flow counts
 */
export const fetchAudienceFlowCounts = async (
  audienceIds: string[]
): Promise<{
  data: Record<string, number> | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('audience_flows')
      .select('audience_id')
      .in('audience_id', audienceIds);
    
    if (error) {
      return { data: null, error };
    }

    // Count flows per audience
    const counts: Record<string, number> = {};
    audienceIds.forEach(id => { counts[id] = 0 });
    
    data.forEach(flow => {
      if (flow.audience_id) {
        counts[flow.audience_id] = (counts[flow.audience_id] || 0) + 1;
      }
    });
    
    return { data: counts, error: null };
  } catch (error) {
    console.error('Error in fetchAudienceFlowCounts:', error);
    return { data: null, error };
  }
};

/**
 * Create a new audience
 * @param audienceData - The audience data to create
 * @returns Promise with the created audience ID
 */
export const createAudience = async (
  audienceData: {
    name: string;
    description?: string;
    organization_id: string;
    created_by: string;
  }
): Promise<{
  id: string | null;
  error: any;
}> => {
  try {
    // Format the user ID properly
    const userId = formatUserId(audienceData.created_by);
    
    const { data, error } = await supabase
      .from('audiences')
      .insert({
        name: audienceData.name,
        description: audienceData.description || null,
        organization_id: audienceData.organization_id,
        created_by: userId // Use the properly formatted ID
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating audience:', error);
      return { id: null, error };
    }

    return { id: data.id, error: null };
  } catch (error) {
    console.error('Error in createAudience:', error);
    return { id: null, error };
  }
};

/**
 * Update cursor flows to associate them with an audience
 * @param audienceId - The ID of the audience
 * @param flowIds - Array of cursor flow IDs to associate
 * @returns Promise with success status
 */
export const associateFlowsWithAudience = async (
  audienceId: string,
  flowIds: string[]
): Promise<{
  success: boolean;
  error?: any;
}> => {
  if (!flowIds.length) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('cursor_flows')
      .update({ audience_id: audienceId })
      .in('id', flowIds);

    if (error) {
      console.error('Error associating flows with audience:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in associateFlowsWithAudience:', error);
    return { success: false, error };
  }
};

/**
 * Create a new audience and associate cursor flows with it
 * @param audienceData - The audience data to create
 * @param flowIds - Array of cursor flow IDs to associate
 * @returns Promise with success status and the created audience ID
 */
export const createAudienceWithFlows = async (
  audienceData: {
    name: string;
    description: string;
    organization_id: string;
    created_by: string;
  },
  flowIds: string[]
): Promise<{
  success: boolean;
  audienceId?: string;
  error?: any;
}> => {
  try {
    // Create the audience
    const { data: audience, error: audienceError } = await supabase
      .from('audiences')
      .insert([audienceData])
      .select()
      .single();
    
    if (audienceError) {
      console.error('Error creating audience:', audienceError);
      return { success: false, error: audienceError };
    }
    
    // If there are flows to add, add them using the audience_flows junction table
    if (flowIds.length > 0) {
      // Create array of objects for the junction table
      const flowEntries = flowIds.map(flowId => ({
        audience_id: audience.id,
        flow_id: flowId
      }));
      
      const { error: flowsError } = await supabase
        .from('audience_flows')
        .insert(flowEntries);
      
      if (flowsError) {
        console.error('Error associating flows with audience:', flowsError);
        return { success: false, audienceId: audience.id, error: flowsError };
      }
    }
    
    return { success: true, audienceId: audience.id };
  } catch (error) {
    console.error('Error in createAudienceWithFlows:', error);
    return { success: false, error };
  }
};

/**
 * Remove a cursor flow from an audience
 * @param flowId - The ID of the cursor flow to remove
 * @param audienceId - The ID of the audience to remove the flow from
 * @returns Promise with success status
 */
export async function removeFlowFromAudience(flowId: string, audienceId: string) {
  try {
    const { error } = await supabase
      .from('audience_flows')
      .delete()
      .match({ flow_id: flowId, audience_id: audienceId });
    
    if (error) {
      console.error('Error removing flow from audience:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception removing flow from audience:', err);
    return { success: false, error: 'Failed to remove flow from audience' };
  }
}

/**
 * Add multiple cursor flows to an existing audience
 * @param audienceId - The ID of the audience to add flows to
 * @param flowIds - Array of cursor flow IDs to add to the audience
 * @returns Promise with success status
 */
export async function addFlowsToAudience(audienceId: string, flowIds: string[]) {
  try {
    // Create an array of objects to insert
    const rowsToInsert = flowIds.map(flowId => ({
      audience_id: audienceId,
      flow_id: flowId
    }));
    
    const { error } = await supabase
      .from('audience_flows')
      .insert(rowsToInsert);
    
    if (error) {
      console.error('Error adding flows to audience:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception adding flows to audience:', err);
    return { success: false, error: 'Failed to add flows to audience' };
  }
}

/**
 * Delete an audience and its relationships in the audience_flows junction table
 * @param audienceId - The ID of the audience to delete
 * @returns Promise with success status
 */
export async function deleteAudience(audienceId: string) {
  try {
    // First, delete all relationships in the audience_flows junction table
    const { error: relationshipsError } = await supabase
      .from('audience_flows')
      .delete()
      .eq('audience_id', audienceId);
    
    if (relationshipsError) {
      console.error('Error deleting audience relationships:', relationshipsError);
      return { success: false, error: relationshipsError.message };
    }
    
    // Then, delete the audience record itself
    const { error: audienceError } = await supabase
      .from('audiences')
      .delete()
      .eq('id', audienceId);
    
    if (audienceError) {
      console.error('Error deleting audience:', audienceError);
      return { success: false, error: audienceError.message };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception deleting audience:', err);
    return { success: false, error: 'Failed to delete audience' };
  }
} 