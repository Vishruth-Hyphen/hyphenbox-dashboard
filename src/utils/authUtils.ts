import { supabase } from '../lib/supabase';

// Function to send magic link for email authentication
export const sendMagicLink = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error sending magic link:', error);
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error };
  }
};
