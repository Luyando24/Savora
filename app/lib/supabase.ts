import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseInstance: any = null;

/**
 * Returns the default Supabase client, lazily initialized.
 * Falls back to placeholders during build-time to prevent Next.js compilation errors.
 */
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const url = supabaseUrl || 'https://placeholder.supabase.co';
    const key = supabaseAnonKey || 'placeholder';
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
};

/**
 * Returns a Supabase client configured with the service role key, lazily initialized.
 * Bypasses RLS. MUST ONLY be called on the server side.
 * Falls back to placeholders during build-time to prevent Next.js compilation errors.
 */
export const getSupabaseAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdminClient can only be called on the server side!');
  }
  
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseServiceRoleKey || 'placeholder';
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
