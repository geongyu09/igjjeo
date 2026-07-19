import Anthropic from "@anthropic-ai/sdk";

import {
  ChatModelError,
  type ChatModelPort,
  type ChatModelRequest,
  type ChatModelResponse,
  type ChatModelStop,
} from "../chat-model.port";

/**
 * 각색은 정해진 JSON 틀을 채우는 형식 작업이라 Haiku 로 충분하다(품질 상향 시 claude-opus-4-8).
 * Haiku 4.5 는 effort 파라미터 미지원(보내면 400)이고, thinking 을 생략하면 추론이 꺼진 채 동작한다.
 */
const DEFAULT_MODEL = "claude-haiku-4-5";

export interface AnthropicChatModelOptions {
  apiKey: string;
  model?: string;
}

/** 이 구현이 실제로 쓰는 Anthropic 클라이언트의 최소 형태(테스트 대체 지점). */
export interface AnthropicMessagesClient {
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

/** Anthropic 종료 사유 → 도메인 3종. */
function normalizeStop(stopReason: string | null | undefined): ChatModelStop {
  if (stopReason === "refusal") return "refused";
  if (stopReason === "max_tokens") return "truncated";
  return "complete";
}

/**
 * Anthropic(Claude) 구현. Anthropic SDK 를 아는 유일한 파일이며,
 * 이 파일 밖으로 벤더 타입이나 stop_reason 문자열이 새어 나가지 않는다.
 */
export class AnthropicChatModel implements ChatModelPort {
  private readonly client: AnthropicMessagesClient;
  private readonly model: string;

  constructor(
    options: AnthropicChatModelOptions,
    client?: AnthropicMessagesClient,
  ) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.client =
      client ??
      (new Anthropic({
        apiKey: options.apiKey,
      }) as unknown as AnthropicMessagesClient);
  }

  async complete(request: ChatModelRequest): Promise<ChatModelResponse> {
    // Anthropic 은 JSON 강제 옵션 대신 프롬프트 지시를 따르므로 jsonOnly 는 참고만 한다.
    let response;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: [{ role: "user", content: request.user }],
      });
    } catch (err) {
      throw new ChatModelError(
        err instanceof Error ? err.message : "Anthropic 호출 실패",
      );
    }

    const text = response.content
      .filter(
        (block) => block.type === "text" && typeof block.text === "string",
      )
      .map((block) => block.text as string)
      .join("");

    return { text, stop: normalizeStop(response.stop_reason) };
  }
}
