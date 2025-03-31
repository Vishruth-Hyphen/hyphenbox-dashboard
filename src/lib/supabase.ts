import { createClient } from '@supabase/supabase-js';

// Create Supabase client with proper configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log initialization for debugging
console.log('[SUPABASE] Initializing Supabase client');
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing credentials: URL or ANON_KEY is empty');
}

// Create the client with more robust configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // important for handling redirect in Next.js
  },
  global: {
    // More robust error handling with a proper timeout
    fetch: (...args) => {
      console.log('[SUPABASE] Making fetch request');
      return fetch(...args).catch(err => {
        console.error('[SUPABASE] Fetch error:', err);
        throw err;
      });
    }
  },
  // Add reasonable defaults for timeouts
  realtime: {
    timeout: 10000 // 10 seconds
  }
});

// Export other types that use Supabase
export type CursorFlow = {
  id: string;
  name: string;
  description: string;
  status: string;
  audience_id?: string | null;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CursorFlowStep = {
  id: string;
  flow_id: string;
  position: number;
  step_data: any;
  screenshot_url: string | null;
  annotation_text: string | null;
  created_at: string;
  updated_at: string;
};

export type CursorFlowRequest = {
  id: string;
  name: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  organization_id: string;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  result_flow_id: string | null;
};
