import type { CommandBus, QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";
import { AdaptContentCommand } from "@/reports/adaptation/adapt-content.command";

import type { CorrectionsRepository } from "./corrections.repository";
import { CorrectionsService } from "./corrections.service";

const articleAccess = {
  id: "a1",
  group_id: "g1",
  report_id: "r1",
  outlet_key: "shock",
  is_active: true,
  is_correction: false,
  corrects_article_id: null,
};

const draft = {
  outlet_key: "shock" as const,
  headline: "본지는 앞선 보도를 정정합니다",
  body: "정정 본문",
  reporter_name: "정정",
};

function articleRow(id: string, reportId: string) {
  return {
    id,
    report_id: reportId,
    group_id: "g1",
    outlet_key: "shock",
    headline: "H",
    body: "B",
    reporter_name: "R",
    published_at: "2026-07-17T00:00:00.000Z",
    is_correction: false,
    corrects_article_id: null,
    is_active: true,
    created_at: "2026-07-17T00:00:00.000Z",
  };
}

function makeService() {
  const corrections = {
    requestDeletion: jest
      .fn()
      .mockResolvedValue({ article_id: "a1", is_active: false }),
    createCorrectionRequest: jest.fn().mockResolvedValue("cr1"),
    insertSubjectCorrection: jest
      .fn()
      .mockResolvedValue({
        ...articleRow("a2", "r1"),
        is_correction: true,
        corrects_article_id: "a1",
      }),
    publishThirdPartyCorrection: jest
      .fn()
      .mockResolvedValue([articleRow("a3", "r2"), articleRow("a4", "r2")]),
  } as unknown as jest.Mocked<CorrectionsRepository>;
  // 기사 접근 인가는 QueryBus, AI 각색은 CommandBus 로 요청한다(모듈 간 통신은 CQRS).
  const queryBus = {
    execute: jest.fn().mockResolvedValue(articleAccess),
  } as unknown as jest.Mocked<QueryBus>;
  const commandBus = {
    execute: jest.fn().mockResolvedValue([draft]),
  } as unknown as jest.Mocked<CommandBus>;
  return {
    service: new CorrectionsService(corrections, queryBus, commandBus),
    corrections,
    queryBus,
    commandBus,
  };
}

describe("CorrectionsService", () => {
  describe("requestDeletion", () => {
    it("멤버십 검사 후 소프트 다운한다", async () => {
      const { service, corrections, queryBus } = makeService();

      const result = await service.requestDeletion("u1", "a1");

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetArticleAccessQuery("u1", "a1"),
      );
      expect(corrections.requestDeletion).toHaveBeenCalledWith("a1", "u1");
      expect(result).toEqual({ article_id: "a1", is_active: false });
    });
  });

  describe("당사자 정정", () => {
    it("원 기사와 같은 outlet 으로 정정 각색 후 정정 기사 1건을 얹는다", async () => {
      const { service, commandBus, corrections } = makeService();

      const result = await service.requestCorrection("u1", "a1", {
        isSubject: true,
        correctionText: "사실 9시 58분 도착",
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        new AdaptContentCommand("g1", "사실 9시 58분 도착", ["shock"], {
          isSelfReport: true,
          isCorrection: true,
        }),
      );
      expect(corrections.insertSubjectCorrection).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: "r1",
          correctsArticleId: "a1",
          outletKey: "shock",
        }),
      );
      expect(result).toMatchObject({
        correction_request_id: "cr1",
        article: { id: "a2", is_correction: true, corrects_article_id: "a1" },
      });
    });
  });

  describe("제3자 정정", () => {
    it("원 기사를 부모로 새 제보를 언론사 수만큼 발행한다", async () => {
      const { service, commandBus, corrections } = makeService();
      (commandBus.execute as jest.Mock).mockResolvedValue([
        draft,
        draft,
        draft,
      ]);

      const result = await service.requestCorrection("u1", "a1", {
        isSubject: false,
        correctionText: "그건 사실이 아니다",
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        new AdaptContentCommand("g1", "그건 사실이 아니다", [
          "daily",
          "shock",
          "economy",
        ]),
      );
      expect(corrections.publishThirdPartyCorrection).toHaveBeenCalledWith(
        expect.objectContaining({ parentArticleId: "a1", reporterId: "u1" }),
      );
      expect(result).toMatchObject({
        correction_request_id: "cr1",
        report_id: "r2",
      });
      expect((result as { articles: unknown[] }).articles).toHaveLength(2);
    });
  });
});
