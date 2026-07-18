import Anthropic from "@anthropic-ai/sdk";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import {
  AdaptationParseError,
  AdaptationUnavailableError,
  buildSystemPrompt,
  buildUserPrompt,
  DEFAULT_REFUSAL_MESSAGE,
  enforceMasking,
  parseAdaptationResponse,
} from "./adaptation.logic";
import {
  type AdaptationInput,
  type AdaptationPort,
  type AdaptationResult,
  OUTLET_KEYS,
} from "./adaptation.types";

/**
 * 각색은 정해진 JSON 틀을 채우는 형식 작업이라 Haiku 로 충분하다(품질 상향 시 claude-opus-4-8).
 * Haiku 4.5 는 effort 파라미터 미지원(보내면 400)이고, thinking 을 생략하면 추론이 꺼진 채 동작한다.
 */
const ADAPTATION_MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 2048;

/** 어댑터가 실제로 쓰는 Anthropic 클라이언트의 최소 형태(테스트 대체 지점). */
export interface MessagesClient {
  messages: {
    create(args: {
      model: string;
      max_tokens: number;
      system: string;
      messages: { role: "user"; content: string }[];
    }): Promise<{
      content: { type: string; text?: string }[];
      stop_reason?: string | null;
    }>;
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
      const { text, stopReason } = await this.generate(system, user);

      // 아래 두 경우는 같은 요청을 다시 보내도 결과가 같으므로 재시도하지 않는다.
      if (stopReason === "refusal") {
        // 모델이 안전 정책으로 거부 — 도메인 거부(422)로 변환해 원인을 살린다.
        return {
          status: "refused",
          reason: "other",
          message: DEFAULT_REFUSAL_MESSAGE,
        };
      }
      if (stopReason === "max_tokens") {
        throw new AdaptationUnavailableError(
          "각색 응답이 max_tokens 한도에서 잘렸습니다",
        );
      }

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

  private async generate(
    system: string,
    user: string,
  ): Promise<{ text: string; stopReason: string | null }> {
    let response: {
      content: { type: string; text?: string }[];
      stop_reason?: string | null;
    };
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

    const text = response.content
      .filter(
        (block) => block.type === "text" && typeof block.text === "string",
      )
      .map((block) => block.text as string)
      .join("");

    return { text, stopReason: response.stop_reason ?? null };
  }
}
