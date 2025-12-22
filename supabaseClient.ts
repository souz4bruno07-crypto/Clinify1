import { createClient } from '@supabase/supabase-js';

// We now attempt to load from environment variables first.
// If not found, we leave them empty to trigger the configuration UI in App.tsx
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

// Only create the client if we have a URL, otherwise create a dummy client to prevent immediate crash
// The App.tsx will check `isConfigured` and block access if false.
export const isConfigured = !!supabaseUrl && !!supabaseKey;

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');