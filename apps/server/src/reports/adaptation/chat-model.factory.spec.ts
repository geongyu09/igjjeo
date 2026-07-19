import type { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import { createChatModel } from "./chat-model.factory";
import { AnthropicChatModel } from "./providers/anthropic.chat-model";
import { GeminiChatModel } from "./providers/gemini.chat-model";

function configOf(env: Partial<AppEnv>) {
  return {
    get: (key: keyof AppEnv) => env[key],
  } as unknown as ConfigService<AppEnv, true>;
}

describe("createChatModel", () => {
  it("AI_PROVIDER=anthropic 이면 Anthropic 구현을 만든다", () => {
    const model = createChatModel(
      configOf({
        AI_PROVIDER: "anthropic",
        ANTHROPIC_API_KEY: "key",
        AI_MODEL: "",
      }),
    );

    expect(model).toBeInstanceOf(AnthropicChatModel);
  });

  it("AI_PROVIDER=gemini 이면 Gemini 구현을 만든다", () => {
    const model = createChatModel(
      configOf({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "key", AI_MODEL: "" }),
    );

    expect(model).toBeInstanceOf(GeminiChatModel);
  });

  it("알 수 없는 프로바이더는 즉시 실패시킨다", () => {
    expect(() =>
      createChatModel(
        configOf({ AI_PROVIDER: "openai" as AppEnv["AI_PROVIDER"] }),
      ),
    ).toThrow(/AI_PROVIDER/);
  });
});
