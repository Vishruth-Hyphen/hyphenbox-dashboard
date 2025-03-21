import { supabase, type CursorFlow, type CursorFlowStep } from "../lib/supabase";
import { 
  parseRecordingToSteps, 
  createCursorFlowSteps as createSteps 
} from "./cursorflowsteps";

/**
 * Fetches all cursor flows from the database
 * @param organizationId - Organization ID to filter by
 * @returns Promise with cursor flows data
 */
export const fetchCursorFlows = async (organizationId?: string): Promise<{
  data: CursorFlow[] | null;
  error: any;
}> => {
  try {
    let query = supabase
      .from('cursor_flows')
      .select('*');
    
    // Filter by organization ID if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Error in fetchCursorFlows:', error);
    return { data: null, error };
  }
};

/**
 * Creates a new cursor flow in the database
 * @param name - The name of the cursor flow
 * @param description - The description of the cursor flow
 * @param organizationId - The organization ID
 * @param userId - The user ID
 * @returns Promise with the created cursor flow data
 */
export const createCursorFlow = async (
  name: string,
  description: string,
  organizationId: string,
  userId: string
): Promise<{
  data: CursorFlow | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('cursor_flows')
      .insert({
        name,
        description,
        status: 'draft',
        organization_id: organizationId,
        created_by: userId,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error in createCursorFlow:', error);
    return { data: null, error };
  }
};

/**
 * Reads a file and parses it as JSON
 * @param file - The file to read
 * @returns Promise with the parsed JSON data
 */
export const readFileAsJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

/**
 * Get the badge variant based on cursor flow status
 * @param status - The status of the cursor flow
 * @returns The badge variant string
 */
export const getBadgeVariantForStatus = (status: string): 'success' | 'warning' | 'neutral' | 'error' | 'brand' => {
  const lowercaseStatus = status.toLowerCase();
  switch (lowercaseStatus) {
    case 'live':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
    case 'paused':
      return 'neutral';
    default:
      return 'neutral';
  }
};

/**
 * Process a JSON file for a cursor flow
 * @param file - The JSON file to process
 * @param flowName - The name for the new cursor flow
 * @param organizationId - The organization ID
 * @param userId - The user ID
 * @returns Promise with the result of the operation
 */
export const processJsonForCursorFlow = async (
  file: File,
  flowName: string,
  organizationId: string,
  userId: string
): Promise<{
  success: boolean;
  flowData?: CursorFlow;
  error?: any;
}> => {
  try {
    // Read and parse the JSON file
    const fileContent = await readFileAsJSON(file);
    if (!fileContent) {
      return { success: false, error: 'Invalid JSON file' };
    }

    // Create the cursor flow
    const { data: flowData, error: flowError } = await createCursorFlow(
      flowName,
      'Uploaded via dashboard',
      organizationId,
      userId
    );

    if (flowError || !flowData) {
      return { success: false, error: flowError };
    }

    // Parse the recording data into steps
    const { stepData, error: parseError } = parseRecordingToSteps(flowData.id, fileContent);
    
    if (parseError) {
      console.error('Error parsing steps:', parseError);
      return { 
        success: true, 
        flowData,
        error: `Flow created but failed to parse steps: ${parseError}`
      };
    }

    // Save the steps to the database
    if (stepData.length > 0) {
      const { success, errors } = await createSteps(stepData);
      
      if (!success) {
        return { 
          success: true, // Flow was created
          flowData,
          error: `Flow created but some steps failed to save: ${JSON.stringify(errors)}`
        };
      }
    }

    return { success: true, flowData };
  } catch (error) {
    console.error('Error in processJsonForCursorFlow:', error);
    return { success: false, error };
  }
};

/**
 * Delete a cursor flow and its steps from the database
 * @param flowId - The ID of the cursor flow to delete
 * @returns Promise with the result of the operation
 */
export const deleteCursorFlow = async (
  flowId: string
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    // Delete from cursor_flows table
    // With proper FK constraints set up with ON DELETE CASCADE, 
    // this would automatically delete steps, but we'll explicitly delete them to be safe
    const { error: stepsError } = await supabase
      .from('cursor_flow_steps')
      .delete()
      .eq('flow_id', flowId);

    if (stepsError) {
      console.error('Error deleting cursor flow steps:', stepsError);
      return { success: false, error: stepsError };
    }
    
    const { error } = await supabase
      .from('cursor_flows')
      .delete()
      .eq('id', flowId);

    if (error) {
      console.error('Error deleting cursor flow:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCursorFlow:', error);
    return { success: false, error };
  }
};

export type CursorFlowStatus = 'live' | 'draft' | 'archived' | 'paused';

export interface CursorFlowData {
  id: string;
  name: string;
  description: string | null;
  status: CursorFlowStatus;
  audience_id: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  published_at: string | null;
  published_by: string | null;
}

/**
 * Get all cursor flows for the organization
 * @param organizationId - Optional organization ID to filter by
 * @returns Promise with the cursor flows
 */
export const getCursorFlows = async (
  organizationId?: string
): Promise<{
  data: CursorFlowData[] | null;
  error: any;
}> => {
  try {
    let query = supabase.from('cursor_flows').select('*');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting cursor flows:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getCursorFlows:', error);
    return { data: null, error };
  }
};

/**
 * Get a cursor flow by ID
 * @param flowId - The ID of the cursor flow to get
 * @returns Promise with the cursor flow
 */
export const getCursorFlow = async (
  flowId: string
): Promise<{
  data: CursorFlowData | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('cursor_flows')
      .select('*')
      .eq('id', flowId)
      .single();

    if (error) {
      console.error('Error getting cursor flow:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getCursorFlow:', error);
    return { data: null, error };
  }
};

/**
 * Process and save an uploaded JSON recording file
 * @param flowId - The ID of the cursor flow to attach the recording to
 * @param jsonData - The parsed JSON data from the uploaded file
 * @returns Promise with success status
 */
export const processAndSaveFlowRecording = async (
  flowId: string,
  jsonData: any
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Parse the JSON recording into step data
    const { stepData, error: parseError } = parseRecordingToSteps(flowId, jsonData);
    
    if (parseError) {
      return { success: false, error: parseError };
    }
    
    // Save the steps to the database
    const { success, errors } = await createSteps(stepData);
    
    if (!success) {
      return { 
        success: false, 
        error: `Failed to save steps: ${errors.map(e => e.message).join(', ')}` 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing and saving recording:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Update a cursor flow's status
 * @param flowId - The ID of the cursor flow to update
 * @param status - The new status
 * @returns Promise with success status
 */
export const updateCursorFlowStatus = async (
  flowId: string,
  status: CursorFlowStatus
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    const { error } = await supabase
      .from('cursor_flows')
      .update({ status })
      .eq('id', flowId);

    if (error) {
      console.error('Error updating cursor flow status:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateCursorFlowStatus:', error);
    return { success: false, error };
  }
};

/**
 * Publish a cursor flow by setting its status to 'Live'
 * @param flowId - The ID of the cursor flow to publish
 * @returns Promise with success status
 */
export const publishCursorFlow = async (
  flowId: string
): Promise<{
  success: boolean;
  error?: any;
}> => {
  return await updateCursorFlowStatus(flowId, 'live');
};

/**
 * Roll back a published flow to draft status
 * @param flowId - The ID of the cursor flow to roll back
 * @returns Promise with success status
 */
export const rollbackCursorFlow = async (
  flowId: string
): Promise<{
  success: boolean;
  error?: any;
}> => {
  return await updateCursorFlowStatus(flowId, 'draft');
};

/**
 * Fetch cursor flows that don't have an audience assigned
 * @param organizationId - Optional organization ID to filter by
 * @returns Promise with unassigned cursor flows
 */
export const fetchUnassignedCursorFlows = async (
  organizationId?: string
): Promise<{
  data: CursorFlow[] | null;
  error: any;
}> => {
  try {
    let query = supabase
      .from('cursor_flows')
      .select('*')
      .is('audience_id', null); // Only get flows without an audience

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching unassigned cursor flows:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in fetchUnassignedCursorFlows:', error);
    return { data: null, error };
  }
};

/**
 * Get audience name for a cursor flow
 * @param flow - The cursor flow object
 * @returns Promise with the audience name
 */
export const getAudienceNameForFlow = async (
  flow: CursorFlow
): Promise<string> => {
  try {
    // If flow doesn't have an audience_id, return a placeholder
    if (!flow.audience_id) {
      return "No audience";
    }
    
    // Query the audiences table to get the audience name
    const { data, error } = await supabase
      .from('audiences')
      .select('name')
      .eq('id', flow.audience_id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching audience name:', error);
      return "Unknown audience";
    }
    
    return data.name;
  } catch (error) {
    console.error('Error in getAudienceNameForFlow:', error);
    return "Unknown audience";
  }
};

/**
 * Fetch cursor flows with their audience names
 * @param organizationId - Optional organization ID to filter by
 * @returns Promise with cursor flows data including audience names
 */
export const fetchCursorFlowsWithAudiences = async (organizationId?: string): Promise<{
  data: (CursorFlow & { audienceName: string })[] | null;
  error: any;
}> => {
  try {
    // First fetch all flows
    const { data: flowsData, error: flowsError } = await fetchCursorFlows(organizationId);
    
    if (flowsError || !flowsData) {
      console.error('Error fetching cursor flows:', flowsError);
      return { data: null, error: flowsError };
    }
    
    // Create a map of audience IDs to process more efficiently
    const audienceIds = flowsData
      .map(flow => flow.audience_id)
      .filter(id => id !== null) as string[];
    
    if (audienceIds.length === 0) {
      // No audiences to fetch, return flows with placeholder
      return { 
        data: flowsData.map(flow => ({ 
          ...flow, 
          audienceName: "No audience" 
        })),
        error: null
      };
    }
    
    // Fetch all needed audiences in one query
    const { data: audiencesData, error: audiencesError } = await supabase
      .from('audiences')
      .select('id, name')
      .in('id', audienceIds);
    
    if (audiencesError) {
      console.error('Error fetching audiences:', audiencesError);
      // Still return flows but with unknown audience names
      return { 
        data: flowsData.map(flow => ({ 
          ...flow, 
          audienceName: "Unknown audience" 
        })),
        error: audiencesError
      };
    }
    
    // Create a map for quick audience lookup
    const audienceMap = (audiencesData || []).reduce((map, audience) => {
      map[audience.id] = audience.name;
      return map;
    }, {} as Record<string, string>);
    
    // Add audience names to flows
    const flowsWithAudiences = flowsData.map(flow => ({
      ...flow,
      audienceName: flow.audience_id 
        ? (audienceMap[flow.audience_id] || "Unknown audience") 
        : "No audience"
    }));
    
    return { data: flowsWithAudiences, error: null };
  } catch (error) {
    console.error('Error in fetchCursorFlowsWithAudiences:', error);
    return { data: null, error };
  }
}; 