import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(RSC·Route Handler)용 Supabase 클라이언트.
 * 요청 쿠키의 사용자 세션으로 동작하므로 RLS가 그대로 적용된다.
 * service_role 이 필요한 작업은 이 클라이언트가 아니라 admin 클라이언트를 쓴다.
 */
export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 에서 호출되면 set 이 불가하다. 세션 갱신은 middleware 에서 처리.
        }
      },
    },
  });
}
