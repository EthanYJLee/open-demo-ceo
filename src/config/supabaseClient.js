import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase 환경 변수가 설정되지 않았습니다.");
  console.error("REACT_APP_SUPABASE_URL:", supabaseUrl);
  console.error(
    "REACT_APP_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "설정됨" : "설정되지 않음"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
