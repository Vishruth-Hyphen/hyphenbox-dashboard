import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
