import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uabstzfqplwcjxtrpixt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CW6BWISbeAGybX7tixHq2Q_rLSAvTRO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
