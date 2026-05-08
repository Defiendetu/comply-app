import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uabstzfqplwcjxtrpixt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CW6BWISbeAGybX7tixHq2Q_rLSAvTRO';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

export const supabase = typeof window !== 'undefined'
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (null as unknown as SupabaseClient);
