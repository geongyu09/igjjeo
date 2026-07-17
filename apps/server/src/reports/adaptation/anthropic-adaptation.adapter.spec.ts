import type { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import {
  AnthropicAdaptationAdapter,
  type MessagesClient,
} from "./anthropic-adaptation.adapter";
import { AdaptationUnavailableError } from "./adaptation.logic";
import type { AdaptationInput } from "./adaptation.types";

const config = {
  get: () => "test-key",
} as unknown as ConfigService<AppEnv, true>;

function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

function makeAdapter(create: jest.Mock) {
  const client = { messages: { create } } as unknown as MessagesClient;
  return new AnthropicAdaptationAdapter(config, client);
}

const input: AdaptationInput = {
  rawText: "김건규가 또 지각했다",
  outletKeys: ["daily"],
  subjects: [{ rawName: "김건규", maskedName: "김*규" }],
  isSelfReport: false,
};

describe("AnthropicAdaptationAdapter", () => {
  it("ok 응답을 파싱하고 남은 실명을 마스킹해 반환한다", async () => {
    const create = jest.fn().mockResolvedValue(
      textResponse(
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
    const adapter = makeAdapter(create);

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

  it("빈 outletKeys 는 MVP 3종으로 채워 프롬프트를 만든다", async () => {
    const create = jest.fn().mockResolvedValue(
      textResponse(
        JSON.stringify({
          status: "ok",
          articles: [
            {
              outlet_key: "daily",
              headline: "H",
              body: "B",
              reporter_name: "R",
            },
          ],
        }),
      ),
    );
    const adapter = makeAdapter(create);

    await adapter.adaptReport({ ...input, outletKeys: [] });

    const userMsg = create.mock.calls[0][0].messages[0].content as string;
    expect(userMsg).toContain("daily, shock, economy");
  });

  it("거부 응답을 그대로 반환한다", async () => {
    const create = jest.fn().mockResolvedValue(
      textResponse(
        JSON.stringify({
          status: "refused",
          reason: "appearance_or_ability",
          message: "외모 평가는 안 돼요",
        }),
      ),
    );
    const adapter = makeAdapter(create);

    const result = await adapter.adaptReport(input);
    expect(result.status).toBe("refused");
  });

  it("파싱 실패는 1회 재시도하고, 재시도도 실패하면 AdaptationUnavailableError", async () => {
    const create = jest
      .fn()
      .mockResolvedValue(textResponse("설명뿐 JSON 아님"));
    const adapter = makeAdapter(create);

    await expect(adapter.adaptReport(input)).rejects.toBeInstanceOf(
      AdaptationUnavailableError,
    );
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("첫 시도 파싱 실패 후 재시도가 성공하면 결과를 반환한다", async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce(textResponse("깨진 응답"))
      .mockResolvedValueOnce(
        textResponse(
          JSON.stringify({
            status: "ok",
            articles: [
              {
                outlet_key: "daily",
                headline: "H",
                body: "B",
                reporter_name: "R",
              },
            ],
          }),
        ),
      );
    const adapter = makeAdapter(create);

    const result = await adapter.adaptReport(input);
    expect(result.status).toBe("ok");
  });

  it("upstream 이 예외를 던지면 AdaptationUnavailableError 로 변환한다", async () => {
    const create = jest.fn().mockRejectedValue(new Error("network down"));
    const adapter = makeAdapter(create);

    await expect(adapter.adaptReport(input)).rejects.toBeInstanceOf(
      AdaptationUnavailableError,
    );
  });
});
