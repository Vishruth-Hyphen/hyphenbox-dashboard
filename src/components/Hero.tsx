import { supabase } from "@/lib/supabase";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  // Debug logging
  console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  try {
    // Insert email into Supabase
    const { error: supabaseError, data } = await supabase
      .from('landing_page_visitors')
      .insert([
        { 
          email: email,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    console.log("Supabase response:", { error: supabaseError, data });

    if (supabaseError) throw supabaseError;

    // Rest of your code...
  } catch (err: any) {
    console.error('Error storing email:', err);
    setError(err.message || 'Failed to submit email. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
}; 