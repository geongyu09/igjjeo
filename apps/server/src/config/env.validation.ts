/**
 * 필수 환경변수 검증. 누락 시 부팅 단계에서 즉시 실패시켜
 * 런타임 중 값이 없어 조용히 깨지는 상황을 막는다.
 */

/** 지원하는 AI 각색 프로바이더. 구현은 reports/adaptation/providers/ 에 1:1 로 있다. */
export const AI_PROVIDERS = ["anthropic", "gemini"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

/** 프로바이더별로 요구하는 키 — 쓰지 않는 프로바이더의 키는 없어도 부팅된다. */
const PROVIDER_KEY: Record<AiProvider, "ANTHROPIC_API_KEY" | "GEMINI_API_KEY"> =
  {
    anthropic: "ANTHROPIC_API_KEY",
    gemini: "GEMINI_API_KEY",
  };

export interface AppEnv {
  API_PORT: number;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** 각색에 사용할 프로바이더. 미설정 시 anthropic. */
  AI_PROVIDER: AiProvider;
  /** 프로바이더 기본 모델을 덮어쓸 때만 설정. 빈 문자열이면 구현의 기본값. */
  AI_MODEL: string;
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
  JWT_SECRET: string;
  /** Google id_token 검증용 audience — Google Cloud 웹 클라이언트 ID. */
  GOOGLE_OAUTH_CLIENT_ID: string;
  /** Apple id_token 검증용 audience — iOS 앱 번들 ID(Sign in with Apple). */
  APPLE_OAUTH_CLIENT_ID: string;
}

const REQUIRED_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "GOOGLE_OAUTH_CLIENT_ID",
  "APPLE_OAUTH_CLIENT_ID",
] as const;

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const provider = String(raw.AI_PROVIDER ?? "anthropic") as AiProvider;
  if (!AI_PROVIDERS.includes(provider)) {
    throw new Error(
      `AI_PROVIDER 가 올바르지 않습니다: ${String(raw.AI_PROVIDER)} (가능한 값: ${AI_PROVIDERS.join(", ")})`,
    );
  }

  // 선택한 프로바이더의 키만 필수 — 프로바이더를 바꾸면 이전 키는 지워도 된다.
  const required = [...REQUIRED_KEYS, PROVIDER_KEY[provider]];
  const missing = required.filter((key) => {
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
    AI_PROVIDER: provider,
    AI_MODEL: String(raw.AI_MODEL ?? ""),
    ANTHROPIC_API_KEY: String(raw.ANTHROPIC_API_KEY ?? ""),
    GEMINI_API_KEY: String(raw.GEMINI_API_KEY ?? ""),
    JWT_SECRET: String(raw.JWT_SECRET),
    GOOGLE_OAUTH_CLIENT_ID: String(raw.GOOGLE_OAUTH_CLIENT_ID),
    APPLE_OAUTH_CLIENT_ID: String(raw.APPLE_OAUTH_CLIENT_ID),
  };
}
