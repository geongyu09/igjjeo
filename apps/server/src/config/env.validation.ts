/**
 * 필수 환경변수 검증. 누락 시 부팅 단계에서 즉시 실패시켜
 * 런타임 중 값이 없어 조용히 깨지는 상황을 막는다.
 */

export interface AppEnv {
  API_PORT: number;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  /** Google id_token 검증용 audience — Google Cloud 웹 클라이언트 ID. */
  GOOGLE_OAUTH_CLIENT_ID: string;
  /** Apple id_token 검증용 audience — iOS 앱 번들 ID(Sign in with Apple). */
  APPLE_OAUTH_CLIENT_ID: string;
}

const REQUIRED_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "JWT_SECRET",
  "GOOGLE_OAUTH_CLIENT_ID",
  "APPLE_OAUTH_CLIENT_ID",
] as const;

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = raw[key];
    return value === undefined || value === "";
  });

  if (missing.length > 0) {
    throw new Error(
      `필수 환경변수가 설정되지 않았습니다: ${missing.join(", ")} (apps/server/.env 참고)`,
    );
  }

  const port = Number(raw.API_PORT ?? 4000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `API_PORT 가 올바른 정수가 아닙니다: ${String(raw.API_PORT)}`,
    );
  }

  return {
    API_PORT: port,
    SUPABASE_URL: String(raw.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: String(raw.SUPABASE_SERVICE_ROLE_KEY),
    ANTHROPIC_API_KEY: String(raw.ANTHROPIC_API_KEY),
    JWT_SECRET: String(raw.JWT_SECRET),
    GOOGLE_OAUTH_CLIENT_ID: String(raw.GOOGLE_OAUTH_CLIENT_ID),
    APPLE_OAUTH_CLIENT_ID: String(raw.APPLE_OAUTH_CLIENT_ID),
  };
}
