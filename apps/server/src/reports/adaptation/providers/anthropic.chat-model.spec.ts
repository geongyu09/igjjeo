import { ChatModelError } from "../chat-model.port";
import {
  AnthropicChatModel,
  type AnthropicMessagesClient,
} from "./anthropic.chat-model";

function reply(text: string, stop_reason: string | null = "end_turn") {
  return { content: [{ type: "text", text }], stop_reason };
}

function makeModel(create: jest.Mock) {
  const client = { messages: { create } } as unknown as AnthropicMessagesClient;
  return new AnthropicChatModel({ apiKey: "test-key" }, client);
}

const request = { system: "SYS", user: "USER", maxTokens: 128 };

describe("AnthropicChatModel", () => {
  it("system·user·maxTokens 를 Anthropic 요청 형태로 매핑한다", async () => {
    const create = jest.fn().mockResolvedValue(reply("{}"));

    await makeModel(create).complete(request);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        max_tokens: 128,
        system: "SYS",
        messages: [{ role: "user", content: "USER" }],
      }),
    );
  });

  it("여러 text 블록을 하나로 이어 붙이고 complete 로 정규화한다", async () => {
    const create = jest.fn().mockResolvedValue({
      content: [
        { type: "text", text: "앞" },
        { type: "thinking", thinking: "무시" },
        { type: "text", text: "뒤" },
      ],
      stop_reason: "end_turn",
    });

    const result = await makeModel(create).complete(request);

    expect(result).toEqual({ text: "앞뒤", stop: "complete" });
  });

  it("stop_reason=max_tokens 를 truncated 로 정규화한다", async () => {
    const create = jest.fn().mockResolvedValue(reply("잘림", "max_tokens"));

    const result = await makeModel(create).complete(request);

    expect(result.stop).toBe("truncated");
  });

  it("stop_reason=refusal 을 refused 로 정규화한다", async () => {
    const create = jest.fn().mockResolvedValue(reply("", "refusal"));

    const result = await makeModel(create).complete(request);

    expect(result.stop).toBe("refused");
  });

  it("SDK 예외를 ChatModelError 로 변환한다", async () => {
    const create = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(makeModel(create).complete(request)).rejects.toBeInstanceOf(
      ChatModelError,
    );
  });
});
