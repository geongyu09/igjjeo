import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { QueryBus } from "@nestjs/cqrs";

import { AdaptationService } from "./adaptation.service";
import { AdaptationUnavailableError } from "./adaptation.logic";
import type { AdaptationPort } from "./adaptation.types";

const draftArticles = [
  {
    outlet_key: "daily" as const,
    headline: "H1",
    body: "B1",
    reporter_name: "R1",
  },
];

function makeService() {
  const queryBus = {
    execute: jest
      .fn()
      .mockResolvedValue([{ display_name: "김건규", masked_name: "김*규" }]),
  } as unknown as jest.Mocked<QueryBus>;

  const adapter = {
    adaptReport: jest
      .fn()
      .mockResolvedValue({ status: "ok", articles: draftArticles }),
  } as unknown as jest.Mocked<AdaptationPort>;

  const service = new AdaptationService(queryBus, adapter);
  return { service, queryBus, adapter };
}

describe("AdaptationService", () => {
  it("등장인물 실명을 방 멤버 매칭으로 마스킹해 어댑터에 넘긴다", async () => {
    const { service, adapter } = makeService();

    await service.adapt("g1", "김건규가 또 지각했다", ["daily"]);

    expect(adapter.adaptReport).toHaveBeenCalledWith(
      expect.objectContaining({
        rawText: "김건규가 또 지각했다",
        outletKeys: ["daily"],
        subjects: [{ rawName: "김건규", maskedName: "김*규" }],
        isSelfReport: false,
      }),
    );
  });

  it("등장인물이 원문에 없으면 빈 subjects 로 호출한다", async () => {
    const { service, adapter } = makeService();

    await service.adapt("g1", "아무 일도 없었다", ["daily"]);

    expect(adapter.adaptReport).toHaveBeenCalledWith(
      expect.objectContaining({ subjects: [] }),
    );
  });

  it("옵션(isSelfReport·isCorrection)을 어댑터로 전달한다", async () => {
    const { service, adapter } = makeService();

    await service.adapt("g1", "원문", ["daily"], {
      isSelfReport: true,
      isCorrection: true,
    });

    expect(adapter.adaptReport).toHaveBeenCalledWith(
      expect.objectContaining({ isSelfReport: true, isCorrection: true }),
    );
  });

  it("각색 성공 시 기사 초안을 반환한다", async () => {
    const { service } = makeService();
    await expect(service.adapt("g1", "원문", ["daily"])).resolves.toEqual(
      draftArticles,
    );
  });

  it("각색 거부면 422 adaptation_refused", async () => {
    const { service, adapter } = makeService();
    (adapter.adaptReport as jest.Mock).mockResolvedValue({
      status: "refused",
      reason: "appearance_or_ability",
      message: "안 돼요",
    });

    await expect(
      service.adapt("g1", "못생겼다", ["daily"]),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it("각색 upstream 장애면 503 ai_unavailable", async () => {
    const { service, adapter } = makeService();
    (adapter.adaptReport as jest.Mock).mockRejectedValue(
      new AdaptationUnavailableError("down"),
    );

    await expect(service.adapt("g1", "원문", ["daily"])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
