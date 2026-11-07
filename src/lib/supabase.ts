import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vzseraajdghzykhskimp.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_CyfmCKR8-26qt-eSpeC6mw_PdHGHokh";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
