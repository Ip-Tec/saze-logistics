// packages/shared/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Ensure you use the NEXT_PUBLIC_ prefix if this is for client-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing!");
}

export const supabaseFE = createClient(supabaseUrl, supabaseAnonKey);
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
