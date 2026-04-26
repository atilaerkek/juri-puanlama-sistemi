import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Juror {
  id: string;
  name: string;
  pin: string;
  max_score: number;
  group_name: string;
  created_at: string;
}

export interface Score {
  id: string;
  juror_id: string;
  artwork_number: number;
  score: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface AdminConfig {
  id: string;
  admin_pin: string;
}
