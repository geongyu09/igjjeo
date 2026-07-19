import { ChatModelError } from "../chat-model.port";
import { GeminiChatModel } from "./gemini.chat-model";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function candidate(text: string, finishReason = "STOP") {
  return {
    candidates: [{ content: { parts: [{ text }] }, finishReason }],
  };
}

function makeModel(fetchImpl: jest.Mock) {
  return new GeminiChatModel(
    { apiKey: "test-key", model: "gemini-3.1-flash-lite" },
    fetchImpl as unknown as typeof fetch,
  );
}

const request = { system: "SYS", user: "USER", maxTokens: 128 };

describe("GeminiChatModel", () => {
  it("system·user·maxTokens 를 Gemini 요청 형태로 매핑한다", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(candidate("{}")));

    await makeModel(fetchImpl).complete(request);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain("gemini-3.1-flash-lite:generateContent");
    expect(JSON.parse(init.body)).toMatchObject({
      systemInstruction: { parts: [{ text: "SYS" }] },
      contents: [{ role: "user", parts: [{ text: "USER" }] }],
      generationConfig: { maxOutputTokens: 128 },
    });
  });

  it("API 키를 URL 이 아닌 헤더로 보낸다", async () => {
    // 키가 URL 에 실리면 프록시·로그에 남는다.
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(candidate("{}")));

    await makeModel(fetchImpl).complete(request);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).not.toContain("test-key");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
  });

  it("jsonOnly 면 JSON 응답 형식을 강제한다", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(candidate("{}")));

    await makeModel(fetchImpl).complete({ ...request, jsonOnly: true });

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("기본적으로 사고(thinking)를 꺼서 출력 한도를 본문에만 쓴다", async () => {
    // Gemini 3.x 는 사고 토큰을 maxOutputTokens 에서 차감하므로, 끄지 않으면
    // 본문이 나오기 전에 한도에 걸려 truncated 가 된다.
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(candidate("{}")));

    await makeModel(fetchImpl).complete(request);

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it("thinkingBudget 을 지정하면 그 값으로 사고를 허용한다", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(candidate("{}")));
    const model = new GeminiChatModel(
      { apiKey: "test-key", thinkingBudget: 512 },
      fetchImpl as unknown as typeof fetch,
    );

    await model.complete(request);

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.generationConfig.thinkingConfig).toEqual({
      thinkingBudget: 512,
    });
  });

  it("여러 part 를 하나로 이어 붙이고 complete 로 정규화한다", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        candidates: [
          {
            content: { parts: [{ text: "앞" }, { text: "뒤" }] },
            finishReason: "STOP",
          },
        ],
      }),
    );

    const result = await makeModel(fetchImpl).complete(request);

    expect(result).toEqual({ text: "앞뒤", stop: "complete" });
  });

  it("finishReason=MAX_TOKENS 를 truncated 로 정규화한다", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(candidate("잘림", "MAX_TOKENS")));

    const result = await makeModel(fetchImpl).complete(request);

    expect(result.stop).toBe("truncated");
  });

  it.each(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"])(
    "finishReason=%s 를 refused 로 정규화한다",
    async (finishReason) => {
      const fetchImpl = jest
        .fn()
        .mockResolvedValue(jsonResponse(candidate("", finishReason)));

      const result = await makeModel(fetchImpl).complete(request);

      expect(result.stop).toBe("refused");
    },
  );

  it("프롬프트가 차단되면(promptFeedback.blockReason) refused 로 정규화한다", async () => {
    // 이때는 candidates 자체가 오지 않는다.
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ promptFeedback: { blockReason: "SAFETY" } }),
      );

    const result = await makeModel(fetchImpl).complete(request);

    expect(result).toEqual({ text: "", stop: "refused" });
  });

  it("HTTP 오류를 ChatModelError 로 변환한다", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { message: "quota exceeded" } }, false, 429),
      );

    await expect(makeModel(fetchImpl).complete(request)).rejects.toBeInstanceOf(
      ChatModelError,
    );
  });

  it("네트워크 예외를 ChatModelError 로 변환한다", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(makeModel(fetchImpl).complete(request)).rejects.toBeInstanceOf(
      ChatModelError,
    );
  });

  it("후보도 차단 사유도 없는 응답은 ChatModelError", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({}));

    await expect(makeModel(fetchImpl).complete(request)).rejects.toBeInstanceOf(
      ChatModelError,
    );
  });

  it("오류 메시지에 API 키를 노출하지 않는다", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { message: "bad key test-key" } }, false, 401),
      );

    await expect(makeModel(fetchImpl).complete(request)).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("test-key"),
      }),
    );
  });
});
