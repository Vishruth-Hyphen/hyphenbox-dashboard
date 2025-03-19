// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Replace with your actual values from Supabase Dashboard → Settings → API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
