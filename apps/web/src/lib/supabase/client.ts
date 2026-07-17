import { createBrowserClient } from "@supabase/ssr";

// NEXT_PUBLIC_* 은 리터럴 접근일 때만 빌드 타임에 인라인되므로 모듈 스코프에서 리터럴로 읽는다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * anon key만 사용하며 RLS로 보호된다. 서버 전용 키는 절대 여기서 쓰지 않는다.
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
