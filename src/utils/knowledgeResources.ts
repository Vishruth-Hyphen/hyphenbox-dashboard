import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Define types
export type ResourceType = 'file' | 'link';

export interface KnowledgeResource {
  id: string;
  name: string;
  type: ResourceType;
  file_url: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ResourceUploadResponse {
  success: boolean;
  resource?: KnowledgeResource;
  error?: any;
}

/**
 * Upload a file to the knowledge resources bucket
 * @param file - The file to upload
 * @param organizationId - The ID of the organization
 * @param userId - The ID of the user uploading the file
 * @returns Promise with the upload result
 */
export const uploadFile = async (
  file: File,
  organizationId: string,
  userId: string
): Promise<ResourceUploadResponse> => {
  try {
    // Generate a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${organizationId}/${fileName}`;
    
    // Upload the file to the bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-resources')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: uploadError };
    }
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('knowledge-resources')
      .getPublicUrl(filePath);
    
    // Create a record in the knowledge_resources table
    const { data: resourceData, error: resourceError } = await supabase
      .from('knowledge_resources')
      .insert({
        name: file.name,
        type: 'file',
        file_url: urlData.publicUrl,
        organization_id: organizationId,
        created_by: userId
      })
      .select()
      .single();
    
    if (resourceError) {
      console.error('Error creating resource record:', resourceError);
      return { success: false, error: resourceError };
    }
    
    return { success: true, resource: resourceData };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return { success: false, error };
  }
};

/**
 * Upload multiple files to the knowledge resources bucket
 * @param files - The files to upload
 * @param organizationId - The ID of the organization
 * @param userId - The ID of the user uploading the files
 * @returns Promise with the upload results
 */
export const uploadMultipleFiles = async (
  files: File[],
  organizationId: string,
  userId: string
): Promise<{
  success: boolean;
  resources: KnowledgeResource[];
  errors: any[];
}> => {
  const resources: KnowledgeResource[] = [];
  const errors: any[] = [];
  
  for (const file of files) {
    const result = await uploadFile(file, organizationId, userId);
    if (result.success && result.resource) {
      resources.push(result.resource);
    } else {
      errors.push({ file: file.name, error: result.error });
    }
  }
  
  return {
    success: errors.length === 0,
    resources,
    errors
  };
};

/**
 * Add a link to the knowledge resources
 * @param url - The URL to add
 * @param name - The name of the link
 * @param organizationId - The ID of the organization
 * @param userId - The ID of the user adding the link
 * @returns Promise with the result
 */
export const addLink = async (
  url: string,
  name: string,
  organizationId: string,
  userId: string
): Promise<ResourceUploadResponse> => {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return { success: false, error: 'Invalid URL format' };
    }
    
    // Generate a name if not provided
    const linkName = name || new URL(url).hostname;
    
    // Create a record in the knowledge_resources table
    const { data: resourceData, error: resourceError } = await supabase
      .from('knowledge_resources')
      .insert({
        name: linkName,
        type: 'link',
        file_url: url,
        organization_id: organizationId,
        created_by: userId
      })
      .select()
      .single();
    
    if (resourceError) {
      console.error('Error creating link record:', resourceError);
      return { success: false, error: resourceError };
    }
    
    return { success: true, resource: resourceData };
  } catch (error) {
    console.error('Error in addLink:', error);
    return { success: false, error };
  }
};

/**
 * Fetch all knowledge resources for an organization
 * @param organizationId - The ID of the organization
 * @returns Promise with the resources
 */
export const fetchResources = async (
  organizationId: string
): Promise<{
  data: KnowledgeResource[] | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('knowledge_resources')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching resources:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in fetchResources:', error);
    return { data: null, error };
  }
};

/**
 * Delete a knowledge resource
 * @param resourceId - The ID of the resource to delete
 * @param organizationId - The organization ID for validation
 * @returns Promise with the delete result
 */
export const deleteResource = async (
  resourceId: string,
  organizationId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // First get the resource to check its type and path
    const { data: resource, error: fetchError } = await supabase
      .from('knowledge_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('organization_id', organizationId)
      .single();
    
    if (fetchError || !resource) {
      console.error('Error fetching resource to delete:', fetchError);
      return { success: false, error: fetchError || 'Resource not found' };
    }
    
    // If it's a file, delete it from storage
    if (resource.type === 'file') {
      try {
        // Extract the file path from the URL
        const url = new URL(resource.file_url);
        const pathParts = url.pathname.split('/');
        const fileKey = pathParts[pathParts.length - 1]; // Get the filename
        const filePath = `${organizationId}/${fileKey}`; // Reconstruct the path
        
        const { error: storageError } = await supabase.storage
          .from('knowledge-resources')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Could not delete file from storage:', storageError);
          // Continue anyway to delete the database record
        }
      } catch (e) {
        console.warn('Error parsing file URL or deleting file:', e);
        // Continue anyway to delete the database record
      }
    }
    
    // Delete the record from the database
    const { error: deleteError } = await supabase
      .from('knowledge_resources')
      .delete()
      .eq('id', resourceId)
      .eq('organization_id', organizationId);
    
    if (deleteError) {
      console.error('Error deleting resource record:', deleteError);
      return { success: false, error: deleteError };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteResource:', error);
    return { success: false, error };
  }
};

/**
 * Get a temporary download URL for a file
 * @param resourceId - The ID of the resource
 * @param organizationId - The organization ID for validation
 * @returns Promise with the download URL
 */
export const getDownloadUrl = async (
  resourceId: string,
  organizationId: string
): Promise<{ url: string | null; error?: any }> => {
  try {
    // Get the resource
    const { data: resource, error: fetchError } = await supabase
      .from('knowledge_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('organization_id', organizationId)
      .single();
    
    if (fetchError || !resource) {
      console.error('Error fetching resource:', fetchError);
      return { url: null, error: fetchError || 'Resource not found' };
    }
    
    // For links, just return the URL
    if (resource.type === 'link') {
      return { url: resource.file_url };
    }
    
    // For files, return the public URL
    return { url: resource.file_url };
  } catch (error) {
    console.error('Error in getDownloadUrl:', error);
    return { url: null, error };
  }
};
