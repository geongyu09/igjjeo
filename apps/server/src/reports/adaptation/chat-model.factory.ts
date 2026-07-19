import type { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import type { ChatModelPort } from "./chat-model.port";
import { AnthropicChatModel } from "./providers/anthropic.chat-model";
import { GeminiChatModel } from "./providers/gemini.chat-model";

/**
 * AI_PROVIDER 환경변수로 프로바이더 구현을 고른다 — 이 파일이 프로바이더 선택의 유일한 분기점.
 *
 * 새 프로바이더 추가 절차:
 *   1. providers/<name>.chat-model.ts 에 ChatModelPort 구현 추가
 *   2. env.validation.ts 의 AI_PROVIDERS 와 필요한 키 추가
 *   3. 아래 switch 에 한 줄 추가
 * 도메인 코드(어댑터·서비스·프롬프트)는 어느 단계에서도 바뀌지 않는다.
 */
export function createChatModel(
  config: ConfigService<AppEnv, true>,
): ChatModelPort {
  const provider = config.get("AI_PROVIDER", { infer: true });
  // 빈 문자열이면 각 구현의 기본 모델을 쓴다.
  const model = config.get("AI_MODEL", { infer: true }) || undefined;

  switch (provider) {
    case "anthropic":
      return new AnthropicChatModel({
        apiKey: config.get("ANTHROPIC_API_KEY", { infer: true }),
        model,
      });
    case "gemini":
      return new GeminiChatModel({
        apiKey: config.get("GEMINI_API_KEY", { infer: true }),
        model,
      });
    default: {
      // env 검증을 통과했다면 도달하지 않는다(타입 수준에서도 never).
      const unsupported: never = provider;
      throw new Error(
        `지원하지 않는 AI_PROVIDER 입니다: ${String(unsupported)}`,
      );
    }
  }
}
