import { createClient } from '@supabase/supabase-js';

// Create Supabase client with proper configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Extract the project reference from the URL (needed for cookie name)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || '';

// Log initialization for debugging only if credentials are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[AUTH] Supabase: Missing credentials - URL or ANON_KEY is empty');
}

// Create the client with more robust configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: `sb-${projectRef}-auth-token`,
    storage: {
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          // Still store in localStorage for client-side code
          localStorage.setItem(key, value);
          
          // Set a proper cookie that will be visible to the server
          // Use key attributes to ensure cookie is sent with requests
          document.cookie = `${key}=${value}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
          // Properly expire the cookie by setting max-age=0
          document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
        }
      }
    }
  },
  global: {
    // More robust error handling with a proper timeout
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('[AUTH] Supabase fetch error:', err);
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
  description: string | null;
  status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  published_at: string | null;
  published_by: string | null;
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
