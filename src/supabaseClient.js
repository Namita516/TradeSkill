import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osziktdtvybqaasrbjnl.supabase.co';
const supabaseAnonKey = 'sb_publishable_HXB6GIaqHX95MceGJVgCmg_remNyVQn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);