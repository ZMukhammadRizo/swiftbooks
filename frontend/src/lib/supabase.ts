import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Temporarily hardcode the values to fix the environment variable issue
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hrynukdpjcmwwljcrkkt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeW51a2RwamNtd3dsamNya2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjQ3MzcsImV4cCI6MjA2NzkwMDczN30.pZ49FM0rTYh_JvDS_nqe1jbNYrKqe-lEgmmPpIwT_e4';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase; 