import { createClient } from "@supabase/supabase-js";

/**
 * service_role 키를 쓰는 관리자 Supabase 클라이언트. **RLS 를 우회한다.**
 * 반드시 서버(Route Handler 등)에서만 호출하고, 클라이언트 번들에 절대 노출하지 않는다.
 * 방(그룹) 단위 격리를 코드로 직접 보장해야 하는 곳에서만 신중히 사용한다.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createSupabaseAdminClient 는 서버에서만 호출할 수 있습니다",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
