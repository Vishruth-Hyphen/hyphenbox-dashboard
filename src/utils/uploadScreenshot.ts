import { supabase } from '@/lib/supabase';
/**
 * Upload a base64 screenshot to Supabase storage
 * @param base64Image - The base64 encoded image data
 * @param organizationId - The organization ID for the storage path
 * @returns Promise with the public URL of the uploaded image
 */
export const uploadScreenshot = async (
  base64Image: string,
  organizationId: string
): Promise<{ url: string | null; error: any }> => {
  try {
    // Remove the data:image/png;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
    const filePath = `${organizationId}/${filename}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filePath, buffer, {
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Error uploading screenshot:', uploadError);
      return { url: null, error: uploadError };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error in uploadScreenshot:', error);
    return { url: null, error };
  }
};


