import { validateEnv } from "./env.validation";

const base = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  JWT_SECRET: "secret",
  GOOGLE_OAUTH_CLIENT_ID: "google",
  APPLE_OAUTH_CLIENT_ID: "apple",
};

describe("validateEnv", () => {
  it("AI_PROVIDER 를 생략하면 anthropic 으로 동작한다", () => {
    const env = validateEnv({ ...base, ANTHROPIC_API_KEY: "sk-ant" });

    expect(env.AI_PROVIDER).toBe("anthropic");
  });

  it("anthropic 인데 ANTHROPIC_API_KEY 가 없으면 부팅에 실패한다", () => {
    expect(() => validateEnv({ ...base })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("gemini 인데 GEMINI_API_KEY 가 없으면 부팅에 실패한다", () => {
    expect(() => validateEnv({ ...base, AI_PROVIDER: "gemini" })).toThrow(
      /GEMINI_API_KEY/,
    );
  });

  it("gemini 로 쓸 때는 ANTHROPIC_API_KEY 없이도 부팅된다", () => {
    // 프로바이더를 교체하면 이전 프로바이더의 키는 더 이상 필요 없어야 한다.
    const env = validateEnv({
      ...base,
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "gem-key",
    });

    expect(env.AI_PROVIDER).toBe("gemini");
    expect(env.GEMINI_API_KEY).toBe("gem-key");
  });

  it("지원하지 않는 AI_PROVIDER 는 부팅에 실패한다", () => {
    expect(() =>
      validateEnv({ ...base, AI_PROVIDER: "openai", OPENAI_API_KEY: "x" }),
    ).toThrow(/AI_PROVIDER/);
  });

  it("AI_MODEL 을 생략하면 빈 문자열(프로바이더 기본 모델)이다", () => {
    const env = validateEnv({ ...base, ANTHROPIC_API_KEY: "sk-ant" });

    expect(env.AI_MODEL).toBe("");
  });

  it("나머지 필수 키 누락은 그대로 실패한다", () => {
    expect(() =>
      validateEnv({ ...base, SUPABASE_URL: "", ANTHROPIC_API_KEY: "sk-ant" }),
    ).toThrow(/SUPABASE_URL/);
  });
});
