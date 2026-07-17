import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";

import type { GroupsRepository } from "@/groups/groups.repository";

import { AdaptationUnavailableError } from "./adaptation/adaptation.logic";
import type { AdaptationPort } from "./adaptation/adaptation.types";
import type { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

const draftArticles = [
  { outlet_key: "daily" as const, headline: "H1", body: "B1", reporter_name: "R1" },
  { outlet_key: "shock" as const, headline: "H2", body: "B2", reporter_name: "R2" },
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
    createReport: jest.fn().mockResolvedValue({ ...reportRow, draft_articles: null }),
    getReport: jest.fn().mockResolvedValue(reportRow),
    saveDraft: jest.fn().mockResolvedValue(undefined),
    publishReport: jest.fn(),
  } as unknown as jest.Mocked<ReportsRepository>;

  const groups = {
    findMembership: jest.fn().mockResolvedValue({ role: "member" }),
    listMembers: jest.fn().mockResolvedValue([
      {
        user_id: "u9",
        display_name: "김건규",
        masked_name: "김*규",
        role: "member",
        joined_at: reportRow.created_at,
      },
    ]),
  } as unknown as jest.Mocked<GroupsRepository>;

  const adaptation = {
    adaptReport: jest
      .fn()
      .mockResolvedValue({ status: "ok", articles: draftArticles }),
  } as unknown as jest.Mocked<AdaptationPort>;

  const service = new ReportsService(reports, groups, adaptation);
  return { service, reports, groups, adaptation };
}

describe("ReportsService", () => {
  describe("createReport", () => {
    it("방 멤버가 아니면 404", async () => {
      const { service, groups } = makeService();
      (groups.findMembership as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createReport("u1", "g1", { rawText: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("등장인물 실명을 방 멤버 매칭으로 마스킹해 어댑터에 넘긴다", async () => {
      const { service, adaptation } = makeService();

      await service.createReport("u1", "g1", { rawText: "김건규가 또 지각했다" });

      expect(adaptation.adaptReport).toHaveBeenCalledWith(
        expect.objectContaining({
          subjects: [{ rawName: "김건규", maskedName: "김*규" }],
        }),
      );
    });

    it("각색 성공 시 초안을 캐시하고 반환한다", async () => {
      const { service, reports } = makeService();

      const result = await service.createReport("u1", "g1", { rawText: "원문" });

      expect(reports.saveDraft).toHaveBeenCalledWith(
        reportRow.id,
        draftArticles,
      );
      expect(result.draft_articles).toEqual(draftArticles);
      expect(result.report.status).toBe("draft");
    });

    it("각색 거부면 422 adaptation_refused", async () => {
      const { service, adaptation } = makeService();
      (adaptation.adaptReport as jest.Mock).mockResolvedValue({
        status: "refused",
        reason: "appearance_or_ability",
        message: "안 돼요",
      });

      await expect(
        service.createReport("u1", "g1", { rawText: "못생겼다" }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it("각색 upstream 장애면 503", async () => {
      const { service, adaptation } = makeService();
      (adaptation.adaptReport as jest.Mock).mockRejectedValue(
        new AdaptationUnavailableError("down"),
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
        service.publish("u1", "r1", ["economy"]),
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
      const { service, groups } = makeService();
      (groups.findMembership as jest.Mock).mockResolvedValue(null);
      await expect(service.getReport("u1", "r1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
