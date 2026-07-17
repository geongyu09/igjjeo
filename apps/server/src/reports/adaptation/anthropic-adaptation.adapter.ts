import Anthropic from "@anthropic-ai/sdk";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import {
  AdaptationParseError,
  AdaptationUnavailableError,
  buildSystemPrompt,
  buildUserPrompt,
  enforceMasking,
  parseAdaptationResponse,
} from "./adaptation.logic";
import {
  type AdaptationInput,
  type AdaptationPort,
  type AdaptationResult,
  OUTLET_KEYS,
} from "./adaptation.types";

/** tech-stack.md: 기본 claude-sonnet-5 로 시작, 품질 상향 시 claude-opus-4-8. */
const ADAPTATION_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 2048;

/** 어댑터가 실제로 쓰는 Anthropic 클라이언트의 최소 형태(테스트 대체 지점). */
export interface MessagesClient {
  messages: {
    create(args: {
      model: string;
      max_tokens: number;
      system: string;
      messages: { role: "user"; content: string }[];
    }): Promise<{ content: { type: string; text?: string }[] }>;
  };
}

/**
 * AI 각색의 서버 내부 단일 봉합선(AdaptationPort 구현). 프롬프트 구성·응답 파싱·마스킹
 * 강제는 순수 로직(adaptation.logic)에 두고, 이 어댑터는 모델 호출과 재시도만 담당한다.
 */
@Injectable()
export class AnthropicAdaptationAdapter implements AdaptationPort {
  private readonly client: MessagesClient;

  constructor(config: ConfigService<AppEnv, true>, client?: MessagesClient) {
    this.client =
      client ??
      (new Anthropic({
        apiKey: config.get("ANTHROPIC_API_KEY", { infer: true }),
      }) as unknown as MessagesClient);
  }

  async adaptReport(input: AdaptationInput): Promise<AdaptationResult> {
    const outletKeys =
      input.outletKeys.length > 0 ? input.outletKeys : OUTLET_KEYS;
    const request = { ...input, outletKeys };
    const system = buildSystemPrompt();
    const user = buildUserPrompt(request);

    // 파싱 실패는 1회 재시도(모델이 가끔 JSON 을 흐트러뜨리므로).
    let lastParseError: AdaptationParseError | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const text = await this.generate(system, user);
      try {
        const result = parseAdaptationResponse(text, outletKeys);
        if (result.status === "refused") {
          return result;
        }
        return {
          status: "ok",
          articles: enforceMasking(result.articles, request.subjects),
        };
      } catch (err) {
        if (err instanceof AdaptationParseError) {
          lastParseError = err;
          continue;
        }
        throw err;
      }
    }

    throw new AdaptationUnavailableError(
      lastParseError?.message ?? "각색 응답을 해석할 수 없습니다",
    );
  }

  private async generate(system: string, user: string): Promise<string> {
    let response: { content: { type: string; text?: string }[] };
    try {
      response = await this.client.messages.create({
        model: ADAPTATION_MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
      });
    } catch (err) {
      throw new AdaptationUnavailableError(
        err instanceof Error ? err.message : "각색 upstream 오류",
      );
    }

    return response.content
      .filter(
        (block) => block.type === "text" && typeof block.text === "string",
      )
      .map((block) => block.text as string)
      .join("");
  }
}
