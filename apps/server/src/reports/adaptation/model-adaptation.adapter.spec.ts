import { AdaptationUnavailableError } from "./adaptation.logic";
import type { AdaptationInput } from "./adaptation.types";
import {
  ChatModelError,
  type ChatModelPort,
  type ChatModelResponse,
  type ChatModelStop,
} from "./chat-model.port";
import { ModelAdaptationAdapter } from "./model-adaptation.adapter";

function response(
  text: string,
  stop: ChatModelStop = "complete",
): ChatModelResponse {
  return { text, stop };
}

function makeAdapter(complete: jest.Mock) {
  const model: ChatModelPort = { complete };
  return new ModelAdaptationAdapter(model);
}

const okPayload = JSON.stringify({
  status: "ok",
  articles: [
    { outlet_key: "daily", headline: "H", body: "B", reporter_name: "R" },
  ],
});

const input: AdaptationInput = {
  rawText: "김건규가 또 지각했다",
  outletKeys: ["daily"],
  subjects: [{ rawName: "김건규", maskedName: "김*규" }],
  isSelfReport: false,
};

describe("ModelAdaptationAdapter", () => {
  it("ok 응답을 파싱하고 남은 실명을 마스킹해 반환한다", async () => {
    const complete = jest.fn().mockResolvedValue(
      response(
        JSON.stringify({
          status: "ok",
          articles: [
            {
              outlet_key: "daily",
              headline: "김건규 씨 지각",
              body: "B",
              reporter_name: "정확한",
            },
          ],
        }),
      ),
    );
    const adapter = makeAdapter(complete);

    const result = await adapter.adaptReport(input);

    expect(result).toEqual({
      status: "ok",
      articles: [
        {
          outlet_key: "daily",
          headline: "김*규 씨 지각",
          body: "B",
          reporter_name: "정확한",
        },
      ],
    });
  });

  // 선택 한도가 3곳이므로 폴백도 그 한도를 넘지 않는다.
  it("빈 outletKeys 는 언론사 선택 한도만큼만 채워 프롬프트를 만든다", async () => {
    const complete = jest.fn().mockResolvedValue(response(okPayload));
    const adapter = makeAdapter(complete);

    await adapter.adaptReport({ ...input, outletKeys: [] });

    expect(complete.mock.calls[0][0].user).toContain("daily, shock, science");
    expect(complete.mock.calls[0][0].user).not.toContain("emotion");
  });

  it("프로바이더에 JSON 전용 출력을 요청한다", async () => {
    const complete = jest.fn().mockResolvedValue(response(okPayload));
    const adapter = makeAdapter(complete);

    await adapter.adaptReport(input);

    expect(complete.mock.calls[0][0]).toMatchObject({
      jsonOnly: true,
      system: expect.any(String),
      maxTokens: expect.any(Number),
    });
  });

  it("거부 응답을 그대로 반환한다", async () => {
    const complete = jest.fn().mockResolvedValue(
      response(
        JSON.stringify({
          status: "refused",
          reason: "appearance_or_ability",
          message: "외모 평가는 안 돼요",
        }),
      ),
    );
    const adapter = makeAdapter(complete);

    const result = await adapter.adaptReport(input);
    expect(result.status).toBe("refused");
  });

  it("파싱 실패는 1회 재시도하고, 재시도도 실패하면 AdaptationUnavailableError", async () => {
    const complete = jest.fn().mockResolvedValue(response("설명뿐 JSON 아님"));
    const adapter = makeAdapter(complete);

    await expect(adapter.adaptReport(input)).rejects.toBeInstanceOf(
      AdaptationUnavailableError,
    );
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it("첫 시도 파싱 실패 후 재시도가 성공하면 결과를 반환한다", async () => {
    const complete = jest
      .fn()
      .mockResolvedValueOnce(response("깨진 응답"))
      .mockResolvedValueOnce(response(okPayload));
    const adapter = makeAdapter(complete);

    const result = await adapter.adaptReport(input);
    expect(result.status).toBe("ok");
  });

  it("잘린 응답(truncated)은 재시도하지 않고 AdaptationUnavailableError", async () => {
    // 같은 요청을 다시 보내도 똑같이 잘리므로 재시도가 의미 없다.
    const complete = jest
      .fn()
      .mockResolvedValue(response('{"status":"ok","articl', "truncated"));
    const adapter = makeAdapter(complete);

    await expect(adapter.adaptReport(input)).rejects.toBeInstanceOf(
      AdaptationUnavailableError,
    );
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("프로바이더가 안전 정책으로 거부하면(refused) 도메인 거부로 변환한다", async () => {
    // 파싱 실패(503)가 아니라 422 adaptation_refused 로 나가야 한다.
    const complete = jest.fn().mockResolvedValue(response("", "refused"));
    const adapter = makeAdapter(complete);

    const result = await adapter.adaptReport(input);

    expect(result).toEqual({
      status: "refused",
      reason: "other",
      message: expect.any(String),
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("프로바이더 호출이 실패하면 AdaptationUnavailableError 로 변환한다", async () => {
    const complete = jest
      .fn()
      .mockRejectedValue(new ChatModelError("network down"));
    const adapter = makeAdapter(complete);

    await expect(adapter.adaptReport(input)).rejects.toBeInstanceOf(
      AdaptationUnavailableError,
    );
  });

  it("프로바이더가 던진 임의의 예외도 AdaptationUnavailableError 로 변환한다", async () => {
    const complete = jest.fn().mockRejectedValue(new Error("boom"));
    const adapter = makeAdapter(complete);

    await expect(adapter.adaptReport(input)).rejects.toBeInstanceOf(
      AdaptationUnavailableError,
    );
  });
});
