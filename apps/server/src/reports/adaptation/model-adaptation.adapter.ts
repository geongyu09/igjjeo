import { Inject, Injectable } from "@nestjs/common";

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
  MAX_OUTLET_SELECTION,
  OUTLET_KEYS,
} from "./adaptation.types";
import { CHAT_MODEL_PORT, type ChatModelPort } from "./chat-model.port";

/** 기사 3종 JSON 을 담기 충분한 출력 한도. */
const MAX_TOKENS = 2048;

/**
 * AI 각색의 서버 내부 단일 봉합선(AdaptationPort 구현).
 *
 * 프롬프트 구성·응답 파싱·마스킹 강제는 순수 로직(adaptation.logic)에, 벤더 호출은
 * ChatModelPort 구현(providers/)에 두고, 이 어댑터는 그 사이의 재시도·거부 처리만 맡는다.
 * 따라서 프로바이더가 바뀌어도 이 파일은 바뀌지 않는다.
 */
@Injectable()
export class ModelAdaptationAdapter implements AdaptationPort {
  constructor(@Inject(CHAT_MODEL_PORT) private readonly model: ChatModelPort) {}

  async adaptReport(input: AdaptationInput): Promise<AdaptationResult> {
    // 미지정 폴백도 선택 한도를 넘지 않는다 — 한도를 우회하는 경로를 만들지 않기 위해.
    const outletKeys =
      input.outletKeys.length > 0
        ? input.outletKeys.slice(0, MAX_OUTLET_SELECTION)
        : OUTLET_KEYS.slice(0, MAX_OUTLET_SELECTION);
    const request = { ...input, outletKeys };
    const system = buildSystemPrompt();
    const user = buildUserPrompt(request);

    // 파싱 실패는 1회 재시도(모델이 가끔 JSON 을 흐트러뜨리므로).
    let lastParseError: AdaptationParseError | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { text, stop } = await this.generate(system, user);

      // 아래 두 경우는 같은 요청을 다시 보내도 결과가 같으므로 재시도하지 않는다.
      if (stop === "refused") {
        // 프로바이더가 안전 정책으로 거부 — 도메인 거부(422)로 변환해 원인을 살린다.
        return {
          status: "refused",
          reason: "other",
          message: DEFAULT_REFUSAL_MESSAGE,
        };
      }
      if (stop === "truncated") {
        throw new AdaptationUnavailableError(
          "각색 응답이 출력 한도에서 잘렸습니다",
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

  /** 프로바이더 실패는 종류를 가리지 않고 각색 장애(503)로 좁힌다. */
  private async generate(system: string, user: string) {
    try {
      return await this.model.complete({
        system,
        user,
        maxTokens: MAX_TOKENS,
        jsonOnly: true,
      });
    } catch (err) {
      throw new AdaptationUnavailableError(
        err instanceof Error ? err.message : "각색 upstream 오류",
      );
    }
  }
}
