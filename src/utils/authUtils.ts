import { supabase } from '../lib/supabase';

// Function to send magic link for email authentication
export const sendMagicLink = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[AUTH] Error sending magic link:', error);
    return { success: false, error };
  }
};

// Function to check if the user is authenticated
export const checkUserAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};

// Function to log out the user
export const logoutUser = async () => {
  try {
    // 1. Clear all auth-related localStorage items
    if (typeof window !== 'undefined') {
      // List all keys that need to be cleared on logout
      const keysToRemove = [
        'selectedOrganizationId',
        'selectedOrganizationName',
        // Add any other auth-related keys here
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Extract the project reference from the URL (same as in supabase.ts)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || '';
      
      // Ensure the auth cookie is cleared with the right name
      const authCookieName = `sb-${projectRef}-auth-token`;
      document.cookie = `${authCookieName}=; path=/; max-age=0; SameSite=Lax`;
    }
    
    // 2. Call Supabase signOut method to clear session cookies and tokens
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AUTH] Error during signOut:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('[AUTH] Error logging out:', error);
    return { success: false, error };
  }
};
