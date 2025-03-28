import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    // Don't throw here, it will break the app
    // Instead, we'll let the Supabase client fail more gracefully
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  global: {
    fetch: (...args) => {
      console.log("Supabase fetch request:", args[0]);
      return fetch(...args);
    }
  }
});

export type CursorFlow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  audience_id: string | null;
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
