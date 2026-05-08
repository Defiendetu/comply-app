import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : 'https://uabstzfqplwcjxtrpixt.supabase.co';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : 'sb_publishable_CW6BWISbeAGybX7tixHq2Q_rLSAvTRO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
