import { createClient } from '@supabase/supabase-js';

// Get Supabase client from environment variables
// You may need to adjust this depending on how your Supabase client is initialized
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a base64 screenshot to Supabase storage
 * 
 * @param base64Image - Base64 encoded image string (may include data URI prefix)
 * @param flowId - The ID of the cursor flow
 * @param stepId - The ID of the step
 * @returns Object containing the public URL or error
 */
export const uploadScreenshotToSupabase = async (
  base64Image: string,
  flowId: string,
  stepId: string
): Promise<{ url: string | null; error: any }> => {
  try {
    // Remove data URI prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1]
      : base64Image;
    
    // Convert base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'image/png' });
    
    // Create file object from blob
    const file = new File([blob], `${stepId}.png`, { type: 'image/png' });
    
    // Path in the bucket where the file will be stored
    const filePath = `${flowId}/${stepId}.png`;
    
    // Upload to Supabase
    const { data, error } = await supabase
      .storage
      .from('screenshots')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading screenshot:', error);
      return { url: null, error };
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase
      .storage
      .from('screenshots')
      .getPublicUrl(filePath);
    
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error processing screenshot:', error);
    return { url: null, error };
  }
};

/**
 * Delete a screenshot from Supabase storage
 * 
 * @param flowId - The ID of the cursor flow
 * @param stepId - The ID of the step
 * @returns Success status and potential error
 */
export const deleteScreenshotFromSupabase = async (
  flowId: string,
  stepId: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const filePath = `${flowId}/${stepId}.png`;
    
    const { error } = await supabase
      .storage
      .from('screenshots')
      .remove([filePath]);
    
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    return { success: false, error };
  }
};
