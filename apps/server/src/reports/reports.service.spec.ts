import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";

import type { QueryBus } from "@nestjs/cqrs";

import type { AdaptationService } from "./adaptation/adaptation.service";
import type { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

const draftArticles = [
  {
    outlet_key: "daily" as const,
    headline: "H1",
    body: "B1",
    reporter_name: "R1",
  },
  {
    outlet_key: "shock" as const,
    headline: "H2",
    body: "B2",
    reporter_name: "R2",
  },
];

const reportRow = {
  id: "r1",
  group_id: "g1",
  reporter_id: "u1",
  raw_text: "김건규가 또 지각했다",
  status: "draft",
  draft_articles: draftArticles,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeService() {
  const reports = {
    createReport: jest
      .fn()
      .mockResolvedValue({ ...reportRow, draft_articles: null }),
    getReport: jest.fn().mockResolvedValue(reportRow),
    saveDraft: jest.fn().mockResolvedValue(undefined),
    publishReport: jest.fn(),
    countReportsToday: jest.fn().mockResolvedValue(0),
    latestRefillAt: jest.fn().mockResolvedValue(null),
    insertRefill: jest.fn().mockResolvedValue("2026-07-17T18:00:00.000Z"),
  } as unknown as jest.Mocked<ReportsRepository>;

  const queryBus = {
    execute: jest.fn().mockResolvedValue({ role: "member" }),
  } as unknown as jest.Mocked<QueryBus>;

  const adaptation = {
    adapt: jest.fn().mockResolvedValue(draftArticles),
  } as unknown as jest.Mocked<AdaptationService>;

  const service = new ReportsService(reports, queryBus, adaptation);
  return { service, reports, queryBus, adaptation };
}

describe("ReportsService", () => {
  describe("createReport", () => {
    it("방 멤버가 아니면 404", async () => {
      const { service, queryBus } = makeService();
      (queryBus.execute as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createReport("u1", "g1", { rawText: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("원문·언론사·자기제보 여부로 각색 서비스를 호출한다", async () => {
      const { service, adaptation } = makeService();

      await service.createReport("u1", "g1", {
        rawText: "김건규가 또 지각했다",
        outletKeys: ["daily"],
        isSelfReport: true,
      });

      expect(adaptation.adapt).toHaveBeenCalledWith(
        "g1",
        "김건규가 또 지각했다",
        ["daily"],
        { isSelfReport: true },
      );
    });

    it("하루 제보 5회를 채웠으면 429 로 막고 각색·생성하지 않는다", async () => {
      const { service, reports, adaptation } = makeService();
      (reports.countReportsToday as jest.Mock).mockResolvedValue(5);

      await expect(
        service.createReport("u1", "g1", { rawText: "원문" }),
      ).rejects.toMatchObject({ status: 429 });

      expect(adaptation.adapt).not.toHaveBeenCalled();
      expect(reports.createReport).not.toHaveBeenCalled();
    });

    it("4회 사용 상태면 5회째 제보를 허용한다", async () => {
      const { service, reports } = makeService();
      (reports.countReportsToday as jest.Mock).mockResolvedValue(4);

      await expect(
        service.createReport("u1", "g1", { rawText: "원문" }),
      ).resolves.toBeDefined();
    });

    it("각색 성공 시 초안을 캐시하고 반환한다", async () => {
      const { service, reports } = makeService();

      const result = await service.createReport("u1", "g1", {
        rawText: "원문",
      });

      expect(reports.saveDraft).toHaveBeenCalledWith(
        reportRow.id,
        draftArticles,
      );
      expect(result.draft_articles).toEqual(draftArticles);
      expect(result.report.status).toBe("draft");
    });

    it("각색 거부(422)를 그대로 전파한다", async () => {
      const { service, adaptation } = makeService();
      (adaptation.adapt as jest.Mock).mockRejectedValue(
        new UnprocessableEntityException(),
      );

      await expect(
        service.createReport("u1", "g1", { rawText: "못생겼다" }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it("각색 upstream 장애(503)를 그대로 전파한다", async () => {
      const { service, adaptation } = makeService();
      (adaptation.adapt as jest.Mock).mockRejectedValue(
        new ServiceUnavailableException(),
      );

      await expect(
        service.createReport("u1", "g1", { rawText: "원문" }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe("regenerate", () => {
    it("제보자 본인이 아니면 404", async () => {
      const { service } = makeService();
      await expect(
        service.regenerate("other", "r1", undefined),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("이미 발행된 제보면 409", async () => {
      const { service, reports } = makeService();
      (reports.getReport as jest.Mock).mockResolvedValue({
        ...reportRow,
        status: "published",
      });

      await expect(
        service.regenerate("u1", "r1", undefined),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("재각색해 초안을 갱신한다", async () => {
      const { service, reports } = makeService();

      const result = await service.regenerate("u1", "r1", undefined);

      expect(reports.saveDraft).toHaveBeenCalled();
      expect(result.draft_articles).toEqual(draftArticles);
    });
  });

  describe("publish", () => {
    it("선택 outlet 을 발행해 기사 배열을 반환한다", async () => {
      const { service, reports } = makeService();
      (reports.publishReport as jest.Mock).mockResolvedValue([
        {
          id: "a1",
          outlet_key: "daily",
          headline: "H1",
          body: "B1",
          reporter_name: "R1",
          published_at: reportRow.created_at,
          is_active: true,
        },
      ]);

      const result = await service.publish("u1", "r1", ["daily"]);

      expect(reports.publishReport).toHaveBeenCalledWith("r1", ["daily"]);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].outlet_key).toBe("daily");
    });

    it("초안에 없는 outlet 을 고르면 400", async () => {
      const { service } = makeService();
      await expect(
        service.publish("u1", "r1", ["science"]),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("이미 발행된 제보면 409", async () => {
      const { service, reports } = makeService();
      (reports.getReport as jest.Mock).mockResolvedValue({
        ...reportRow,
        status: "published",
      });

      await expect(
        service.publish("u1", "r1", ["daily"]),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getReport", () => {
    it("제보와 초안을 반환한다", async () => {
      const { service } = makeService();
      const result = await service.getReport("u1", "r1");
      expect(result.draft_articles).toEqual(draftArticles);
    });

    it("멤버가 아니면 404", async () => {
      const { service, queryBus } = makeService();
      (queryBus.execute as jest.Mock).mockResolvedValue(null);
      await expect(service.getReport("u1", "r1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("getReportQuota", () => {
    it("오늘 사용량으로 한도·사용·잔여를 계산한다", async () => {
      const { service, reports } = makeService();
      (reports.countReportsToday as jest.Mock).mockResolvedValue(2);

      const quota = await service.getReportQuota("u1");

      expect(quota).toEqual({ limit: 5, used: 2, remaining: 3 });
      expect(reports.countReportsToday).toHaveBeenCalledWith(
        "u1",
        expect.any(String),
      );
    });

    it("한도를 다 썼으면 잔여는 0에서 더 내려가지 않는다", async () => {
      const { service, reports } = makeService();
      (reports.countReportsToday as jest.Mock).mockResolvedValue(7);

      const quota = await service.getReportQuota("u1");

      expect(quota).toEqual({ limit: 5, used: 7, remaining: 0 });
    });

    it("오늘 충전한 적이 있으면 그 시각 이후만 센다", async () => {
      const { service, reports } = makeService();
      (reports.latestRefillAt as jest.Mock).mockResolvedValue(
        "2026-07-17T18:00:00.000Z",
      );

      await service.getReportQuota("u1");

      expect(reports.countReportsToday).toHaveBeenCalledWith(
        "u1",
        "2026-07-17T18:00:00.000Z",
      );
    });
  });

  describe("refillReportQuota", () => {
    it("충전을 기록하고 그 시각 기준으로 다시 계산한 한도를 반환한다", async () => {
      const { service, reports } = makeService();
      (reports.countReportsToday as jest.Mock).mockResolvedValue(0);

      const quota = await service.refillReportQuota("u1");

      expect(reports.insertRefill).toHaveBeenCalledWith("u1");
      expect(reports.countReportsToday).toHaveBeenCalledWith(
        "u1",
        "2026-07-17T18:00:00.000Z",
      );
      expect(quota).toEqual({ limit: 5, used: 0, remaining: 5 });
    });
  });

  describe("createReport", () => {
    it("충전 이후 제보만 한도로 세어 다시 제보할 수 있다", async () => {
      const { service, reports } = makeService();
      (reports.latestRefillAt as jest.Mock).mockResolvedValue(
        "2026-07-17T18:00:00.000Z",
      );
      (reports.countReportsToday as jest.Mock).mockResolvedValue(0);

      await service.createReport("u1", "g1", { rawText: "원문" });

      expect(reports.countReportsToday).toHaveBeenCalledWith(
        "u1",
        "2026-07-17T18:00:00.000Z",
      );
      expect(reports.createReport).toHaveBeenCalled();
    });
  });
});
