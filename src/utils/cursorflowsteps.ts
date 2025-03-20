import { supabase } from "../lib/supabase";

export interface CursorFlowStepData {
  id: string;
  flow_id: string;
  position: number;
  step_data: any;
  screenshot_url: string | null;
  annotation_text: string | null;
  is_removed?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Parse JSON recording data into cursor flow steps
 * @param flowId - The ID of the parent cursor flow
 * @param jsonData - The JSON data from the uploaded file
 * @returns Array of parsed steps
 */
export const parseRecordingToSteps = (flowId: string, jsonData: any): {stepData: any[], error?: string} => {
  try {
    // Validate that jsonData has the expected structure
    if (!jsonData?.recording?.interactions || !Array.isArray(jsonData.recording.interactions)) {
      return { 
        stepData: [],
        error: 'Invalid JSON structure: missing interactions array' 
      };
    }

    // Map each interaction to a step
    const steps = jsonData.recording.interactions.map((interaction: any, index: number) => {
      // Extract any text content from the interaction if available
      const annotationText = interaction.element?.textContent || 
                            `Step ${index + 1}: ${interaction.type} on ${interaction.pageInfo?.url || 'unknown page'}`;
      
      return {
        flow_id: flowId,
        position: (index + 1) * 1000, // 1000, 2000, 3000, etc.
        step_data: interaction,
        annotation_text: annotationText,
        is_removed: false, // New field: steps start as not removed
        screenshot_url: null // Screenshots would be handled separately
      };
    });

    return { stepData: steps };
  } catch (error) {
    console.error('Error parsing recording to steps:', error);
    return { 
      stepData: [],
      error: 'Failed to parse recording data' 
    };
  }
}

/**
 * Create multiple cursor flow steps in the database
 * @param steps - Array of step data to create
 * @returns Promise with success status and any errors
 */
export const createCursorFlowSteps = async (
  steps: any[]
): Promise<{
  success: boolean;
  errors: any[];
}> => {
  const errors: any[] = [];
  
  try {
    // Process steps in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < steps.length; i += batchSize) {
      const batch = steps.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('cursor_flow_steps')
        .insert(batch);

      if (error) {
        console.error('Error creating step batch:', error);
        errors.push(error);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    console.error('Error in createCursorFlowSteps:', error);
    return { success: false, errors: [error] };
  }
};

/**
 * Get steps for a specific cursor flow
 * @param flowId - The ID of the cursor flow
 * @returns Promise with the steps data
 */
export const getCursorFlowSteps = async (flowId: string): Promise<{
  data: CursorFlowStepData[] | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('cursor_flow_steps')
      .select('*')
      .eq('flow_id', flowId)
      .order('position', { ascending: true });
    
    return { data, error };
  } catch (error) {
    console.error('Error in getCursorFlowSteps:', error);
    return { data: null, error };
  }
};

/**
 * Get a specific cursor flow with its details
 * @param flowId - The ID of the cursor flow
 * @returns Promise with the flow data and its steps
 */
export const getCursorFlowWithSteps = async (flowId: string): Promise<{
  flow: any | null;
  steps: CursorFlowStepData[] | null;
  error: any;
}> => {
  try {
    // Get the flow details
    const { data: flowData, error: flowError } = await supabase
      .from('cursor_flows')
      .select('*')
      .eq('id', flowId)
      .single();
    
    if (flowError) {
      return { flow: null, steps: null, error: flowError };
    }

    // Get the steps for this flow
    const { data: stepsData, error: stepsError } = await getCursorFlowSteps(flowId);
    
    if (stepsError) {
      return { flow: flowData, steps: null, error: stepsError };
    }

    return { flow: flowData, steps: stepsData, error: null };
  } catch (error) {
    console.error('Error in getCursorFlowWithSteps:', error);
    return { flow: null, steps: null, error };
  }
};

/**
 * Update the annotation text for a specific step
 * @param stepId - The ID of the step to update
 * @param annotationText - The new annotation text
 * @returns Promise with success status
 */
export const updateStepAnnotation = async (
  stepId: string,
  annotationText: string
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    const { error } = await supabase
      .from('cursor_flow_steps')
      .update({ annotation_text: annotationText })
      .eq('id', stepId);

    if (error) {
      console.error('Error updating step annotation:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateStepAnnotation:', error);
    return { success: false, error };
  }
};

/**
 * Save all steps for a cursor flow
 * @param steps - The steps to save with their current state
 * @returns Promise with success status
 */
export const saveSteps = async (
  steps: CursorFlowStepData[]
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    // Use UPSERT to handle both inserts and updates
    const { error } = await supabase
      .from('cursor_flow_steps')
      .upsert(steps, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving steps:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveSteps:', error);
    return { success: false, error };
  }
};

/**
 * Mark a step as removed without deleting it
 * @param stepId - The ID of the step to mark as removed
 * @returns Promise with success status
 */
export const markStepAsRemoved = async (
  stepId: string,
  isRemoved: boolean = true
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    const { error } = await supabase
      .from('cursor_flow_steps')
      .update({ is_removed: isRemoved })
      .eq('id', stepId);

    if (error) {
      console.error('Error marking step as removed:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markStepAsRemoved:', error);
    return { success: false, error };
  }
};

/**
 * Delete a specific step
 * @param stepId - The ID of the step to delete
 * @returns Promise with success status
 */
export const deleteStep = async (
  stepId: string
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    const { error } = await supabase
      .from('cursor_flow_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      console.error('Error deleting step:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteStep:', error);
    return { success: false, error };
  }
};

/**
 * Delete all steps for a specific cursor flow
 * @param flowId - The ID of the cursor flow
 * @returns Promise with success status
 */
export const deleteCursorFlowSteps = async (flowId: string): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    const { error } = await supabase
      .from('cursor_flow_steps')
      .delete()
      .eq('flow_id', flowId);

    if (error) {
      console.error('Error deleting cursor flow steps:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCursorFlowSteps:', error);
    return { success: false, error };
  }
};
