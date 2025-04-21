import { supabase, type CursorFlow as BaseCursorFlow, type CursorFlowStep, type CursorFlowRequest } from "../lib/supabase";
import { 
  parseRecordingToSteps, 
  createCursorFlowSteps as createSteps 
} from "./cursorflowsteps";

// Add interface for the nested audience data structure
interface AudienceFlow {
  audience: {
    id: string;
    name: string;
  };
}

/**
 * Fetches all cursor flows from the database
 * @param organizationId - Organization ID to filter by
 * @returns Promise with cursor flows data
 */
export const fetchCursorFlows = async (organizationId?: string): Promise<{
  data: BaseCursorFlow[] | null;
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
  data: BaseCursorFlow | null;
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
export function getBadgeVariantForStatus(status: string): "error" | "success" | "brand" | "neutral" | "warning" | undefined {
  switch (status.toLowerCase()) {
    case 'published':
    case 'live':
      return 'success';
    case 'draft':
      return 'warning';
    case 'requested':
      return 'neutral'; // Use neutral instead of empty string
    default:
      return 'neutral'; // Default to neutral for other statuses
  }
}

/**
 * Process a JSON file for a cursor flow, creating or updating a flow
 * @param file - The JSON file to process
 * @param flowName - The name for the cursor flow
 * @param organizationId - The organization ID
 * @param userId - The user ID
 * @param existingFlowId - Optional ID of an existing flow to update
 * @returns Promise with the result of the operation
 */
export const processJsonForCursorFlow = async (
  file: File,
  flowName: string,
  organizationId: string,
  userId: string,
  existingFlowId?: string
): Promise<{
  success: boolean;
  flowData?: BaseCursorFlow;
  error?: any;
  textGenerated?: boolean;
  textProcessedCount?: number;
}> => {
  try {
    // Read and parse the JSON file
    const fileContent = await readFileAsJSON(file);
    if (!fileContent) {
      return { success: false, error: 'Invalid JSON file' };
    }

    let flowData: BaseCursorFlow;
    
    if (existingFlowId) {
      // Update existing flow
      const { data, error: updateError } = await supabase
        .from('cursor_flows')
        .update({
          name: flowName,
          description: 'Updated via dashboard',
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFlowId)
        .select()
        .single();
      
      if (updateError || !data) {
        return { success: false, error: updateError || 'Flow not found' };
      }
      
      flowData = data;
      
      // Delete existing steps for this flow
      const { error: deleteError } = await supabase
        .from('cursor_flow_steps')
        .delete()
        .eq('flow_id', existingFlowId);
      
      if (deleteError) {
        return { 
          success: true, // Flow was updated
          flowData,
          error: `Flow updated but failed to remove old steps: ${deleteError}` 
        };
      }
    } else {
      // Create new flow
      const { data: newFlowData, error: flowError } = await createCursorFlow(
        flowName,
        'Uploaded via dashboard',
        organizationId,
        userId
      );

      if (flowError || !newFlowData) {
        return { success: false, error: flowError };
      }
      
      flowData = newFlowData;
    }

    // Parse the recording data into steps
    const { stepData, error: parseError } = parseRecordingToSteps(flowData.id, fileContent);
    
    if (parseError) {
      console.error('Error parsing steps:', parseError);
      return { 
        success: true, 
        flowData,
        error: `Flow ${existingFlowId ? 'updated' : 'created'} but failed to parse steps: ${parseError}`
      };
    }

    // Save the steps to the database
    if (stepData.length > 0) {
      const { success, errors } = await createSteps(stepData);
      
      if (!success) {
        return { 
          success: true, // Flow was created/updated
          flowData,
          error: `Flow ${existingFlowId ? 'updated' : 'created'} but some steps failed to save: ${JSON.stringify(errors)}`
        };
      }
    }

    // After successful step creation, trigger text generation
    console.log('Triggering text generation for flow:', flowData.id);
    const { success: textSuccess, processedCount, error: textError } = await generateCursorFlowText(flowData.id);
    
    if (!textSuccess) {
      console.warn('Failed to generate text for cursor flow steps:', textError);
      // Return success for the overall flow creation, but indicate text generation failed
      return { 
        success: true, 
        flowData, 
        textGenerated: false,
        error: `Flow created successfully, but automatic text generation failed: ${textError}`
      };
    }

    return { 
      success: true, 
      flowData,
      textGenerated: true,
      textProcessedCount: processedCount
    };
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
    // First delete any associated requests
    const { error: requestError } = await supabase
      .from('cursor_flow_requests')
      .delete()
      .eq('result_flow_id', flowId);

    if (requestError) {
      console.error('Error deleting cursor flow request:', requestError);
      return { success: false, error: requestError };
    }
    
    // Delete flow steps
    const { error: stepsError } = await supabase
      .from('cursor_flow_steps')
      .delete()
      .eq('flow_id', flowId);

    if (stepsError) {
      console.error('Error deleting cursor flow steps:', stepsError);
      return { success: false, error: stepsError };
    }
    
    // Delete the flow itself
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
 * Fetch cursor flows that don't have any audience assigned
 * @param organizationId - Organization ID to filter by
 * @returns Promise with unassigned cursor flows
 */
export async function fetchUnassignedCursorFlows(organizationId: string) {
  try {
    // First, get all flow IDs that are assigned to any audience
    const { data: assignedFlows, error: flowsError } = await supabase
      .from('audience_flows')
      .select('flow_id');
    
    if (flowsError) {
      console.error('Error fetching assigned flows:', flowsError);
      return { data: null, error: flowsError.message };
    }
    
    // Extract the assigned flow IDs
    const assignedFlowIds = assignedFlows.map(item => item.flow_id);
    
    // If no flows are assigned yet, just return all flows for the organization
    if (assignedFlowIds.length === 0) {
      const { data, error } = await supabase
        .from('cursor_flows')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching cursor flows:', error);
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    }
    
    // Otherwise, fetch flows that aren't in the list of assigned flows
    const { data, error } = await supabase
      .from('cursor_flows')
      .select('*')
      .eq('organization_id', organizationId)
      .not('id', 'in', `(${assignedFlowIds.join(',')})`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching unassigned cursor flows:', error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Exception fetching unassigned cursor flows:', err);
    return { data: null, error: 'Failed to fetch unassigned cursor flows' };
  }
}

// New function to check if a flow is assigned to a specific audience
export async function isFlowAssignedToAudience(flowId: string, audienceId: string) {
  try {
    const { data, error } = await supabase
      .from('audience_flows')
      .select('*')
      .eq('flow_id', flowId)
      .eq('audience_id', audienceId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error checking if flow is assigned to audience:', error);
      return { isAssigned: false, error: error.message };
    }
    
    return { isAssigned: !!data, error: null };
  } catch (err) {
    console.error('Exception checking if flow is assigned to audience:', err);
    return { isAssigned: false, error: 'Failed to check if flow is assigned to audience' };
  }
}

// New function to get flows not assigned to a specific audience
export async function getFlowsNotInAudience(audienceId: string, organizationId: string) {
  try {
    // Get all flow IDs that are already in this audience
    const { data: existingFlows, error: existingError } = await supabase
      .from('audience_flows')
      .select('flow_id')
      .eq('audience_id', audienceId);
    
    if (existingError) {
      return { data: null, error: existingError.message };
    }
    
    // Extract the flow IDs
    const existingFlowIds = existingFlows.map(f => f.flow_id);
    
    // If no flows are assigned yet, return all organization flows
    if (existingFlowIds.length === 0) {
      return fetchCursorFlows(organizationId);
    }
    
    // Otherwise, get all flows for the organization that aren't in the existing flows
    const { data: availableFlows, error: availableError } = await supabase
      .from('cursor_flows')
      .select('*')
      .eq('organization_id', organizationId)
      .not('id', 'in', `(${existingFlowIds.join(',')})`)
      .order('created_at', { ascending: false });
    
    if (availableError) {
      return { data: null, error: availableError.message };
    }
    
    return { data: availableFlows, error: null };
  } catch (err) {
    console.error('Exception getting flows not in audience:', err);
    return { data: null, error: 'Failed to get flows not in audience' };
  }
}

/**
 * Get audience names for a cursor flow
 * @param flowId - The cursor flow ID
 * @returns Promise with an array of audience names
 */
export const getAudienceNamesForFlow = async (
  flowId: string
): Promise<string[]> => {
  try {
    // Query the audience_flows joining with audiences to get names
    const { data, error } = await supabase
      .from('audience_flows')
      .select(`
        audiences(name)
      `)
      .eq('flow_id', flowId);
    
    if (error || !data || data.length === 0) {
      console.error('Error fetching audience names:', error);
      return ["No audiences"];
    }
    
    // Use any type to bypass TypeScript's type checking for the complex nested structure
    const audienceNames = data.map((item: any) => {
      if (item.audiences && typeof item.audiences.name === 'string') {
        return item.audiences.name;
      }
      return "Unknown audience";
    });
    
    return audienceNames;
  } catch (error) {
    console.error('Error in getAudienceNamesForFlow:', error);
    return ["Unknown audience"];
  }
};

/**
 * Fetch cursor flows with their audience names
 * @param organizationId - Optional organization ID to filter by
 * @returns Promise with cursor flows data including audience names
 */
export const fetchCursorFlowsWithAudiences = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('cursor_flows')
      .select(`
        *,
        audience_flows (
          audience:audiences (id, name)
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cursor flows with audiences:', error);
      return { data: null, error };
    }

    // Process data to flatten audience information using the correct property name
    const processedData = data?.map(flow => {
      // Access the correct property 'audience_flows'
      const audiences = (flow.audience_flows as any[])?.map(afa => afa.audience).filter(Boolean) || [];
      // Remove the junction table data using the correct property name
      const { audience_flows, ...restOfFlow } = flow; 
      return {
        ...restOfFlow,
        audiences: audiences
      };
    }) || [];

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error in fetchCursorFlowsWithAudiences:', error);
    return { data: null, error };
  }
};

export async function createCursorFlowRequest(
  name: string,
  description: string | null,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; error: any; flowId?: string }> {
  try {
    // Start a transaction to create both records
    const { data: flowData, error: flowError } = await supabase
      .from('cursor_flows')
      .insert({
        name,
        description,
        status: 'requested',
        organization_id: organizationId,
        created_by: userId
      })
      .select('id')
      .single();

    if (flowError) {
      return { success: false, error: flowError };
    }

    // Store the new flow ID to reference in the requests table
    const flowId = flowData.id;

    // Create the request record
    const { error: requestError } = await supabase
      .from('cursor_flow_requests')
      .insert({
        name,
        description,
        status: 'pending',
        organization_id: organizationId,
        created_by: userId,
        result_flow_id: flowId  // Link to the cursor_flow we just created
      });

    if (requestError) {
      // If request creation fails, we should clean up the flow we created
      // But since this is a quick solution, we'll leave it for now
      return { success: false, error: requestError };
    }

    return { success: true, error: null, flowId };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Generate text for cursor flow steps using Gemini
 * @param flowId - The ID of the cursor flow to process
 * @returns Promise with the result of the operation
 */
export const generateCursorFlowText = async (
  flowId: string
): Promise<{
  success: boolean;
  message?: string;
  processedCount?: number;
  error?: any;
}> => {
  try {
    // Fix the URL construction here
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hyphenbox-backend.onrender.com';
    
    const response = await fetch(`${apiUrl}/api/cursor-flows/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ flowId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return { 
      success: true,
      message: result.message,
      processedCount: result.processedCount || 0
    };
  } catch (error) {
    console.error('Error triggering text generation:', error);
    return { success: false, error };
  }
};

// Update the CursorFlow type to include audiences
export interface CursorFlow extends BaseCursorFlow {
  audiences?: Array<{ id: string; name: string }>;
}

// Add a function to update cursor flow details like name and description
export const updateCursorFlow = async (
  flowId: string,
  updates: { name?: string; description?: string | null }
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    const { error } = await supabase
      .from('cursor_flows')
      .update(updates)
      .eq('id', flowId);

    if (error) {
      console.error('Error updating cursor flow details:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateCursorFlow:', error);
    return { success: false, error };
  }
};

/**
 * Trigger background embedding generation for a cursor flow
 * @param flowId - The ID of the cursor flow
 * @returns Promise with the result of the trigger request
 */
export const triggerEmbeddingGeneration = async (
  flowId: string
): Promise<{
  success: boolean;
  message?: string;
  error?: any;
}> => {
  // console.log(`[Frontend Embedding Trigger] Attempting to trigger embedding for flow: ${flowId}`); // Removed debug log
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Explicit check for the environment variable
    if (!apiUrl) {
        const errorMsg = "[Frontend Embedding Trigger] Error: NEXT_PUBLIC_API_URL environment variable is not set or empty.";
        console.error(errorMsg); // Keep error log
        // Immediately return failure instead of using fallback
        return { success: false, error: errorMsg }; 
    }

    // console.log(`[Frontend Embedding Trigger] Using API URL: ${apiUrl}`); // Removed debug log
    const endpoint = `${apiUrl}/api/cursor-flows/${flowId}/generate-embedding`;
    // console.log(`[Frontend Embedding Trigger] Fetching endpoint: ${endpoint}`); // Removed debug log

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // No body needed as flowId is in the URL path
    });

    // console.log(`[Frontend Embedding Trigger] Response status: ${response.status}`); // Removed debug log

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error JSON' })); // Add catch for non-JSON errors
      console.error(`[Frontend Embedding Trigger] Error response data:`, errorData); // Keep error log
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown server error'}`);
    }

    const result = await response.json();
    
    console.log(`[Embedding Trigger] Started generation for flow ${flowId}`); // Keep success log
    return { 
      success: true,
      message: result.message || 'Embedding generation started successfully'
    };
  } catch (error) {
    console.error(`[Embedding Trigger] Error triggering embedding generation for flow ${flowId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 