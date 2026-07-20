import type { CommandBus, QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";
import { AdaptContentCommand } from "@/reports/adaptation/adapt-content.command";
import { OUTLET_KEYS } from "@/reports/adaptation/adaptation.types";

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
    insertSubjectCorrection: jest.fn().mockResolvedValue({
      ...articleRow("a2", "r1"),
      is_correction: true,
      corrects_article_id: "a1",
    }),
    publishThirdPartyCorrection: jest
      .fn()
      .mockResolvedValue([articleRow("a3", "r2"), articleRow("a4", "r2")]),
    countCorrectionRequestsToday: jest.fn().mockResolvedValue(0),
    findReporterId: jest.fn().mockResolvedValue("u1"),
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
    it("기사를 올린 제보자 본인이면 멤버십 검사 후 소프트 다운한다", async () => {
      const { service, corrections, queryBus } = makeService();

      const result = await service.requestDeletion("u1", "a1");

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetArticleAccessQuery("u1", "a1", true),
      );
      expect(corrections.findReporterId).toHaveBeenCalledWith("r1");
      expect(corrections.requestDeletion).toHaveBeenCalledWith("a1", "u1");
      expect(result).toEqual({ article_id: "a1", is_active: false });
    });

    it("제보자가 아니면 403 으로 막고 기사를 내리지 않는다", async () => {
      const { service, corrections } = makeService();
      (corrections.findReporterId as jest.Mock).mockResolvedValue("other");

      await expect(service.requestDeletion("u1", "a1")).rejects.toMatchObject({
        status: 403,
      });

      expect(corrections.requestDeletion).not.toHaveBeenCalled();
    });

    it("제보를 찾을 수 없으면 403 으로 막는다", async () => {
      const { service, corrections } = makeService();
      (corrections.findReporterId as jest.Mock).mockResolvedValue(null);

      await expect(service.requestDeletion("u1", "a1")).rejects.toMatchObject({
        status: 403,
      });

      expect(corrections.requestDeletion).not.toHaveBeenCalled();
    });

    // 정정 기사는 원 기사와 report_id 를 공유하므로 제보자로 소유자를 따지면
    // 반박당한 원 제보자가 남의 반박을 내릴 수 있게 된다. 아예 내리지 못하게 막는다.
    it("정정 기사는 원 제보자라도 내릴 수 없다", async () => {
      const { service, corrections, queryBus } = makeService();
      (queryBus.execute as jest.Mock).mockResolvedValue({
        ...articleAccess,
        is_correction: true,
      });

      await expect(service.requestDeletion("u1", "a1")).rejects.toMatchObject({
        status: 403,
      });

      expect(corrections.requestDeletion).not.toHaveBeenCalled();
    });

    it("이미 내려간 기사는 다시 내리지 않는다", async () => {
      const { service, queryBus } = makeService();

      await service.requestDeletion("u1", "a1").catch(() => undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetArticleAccessQuery("u1", "a1", true),
      );
    });
  });

  describe("하루 정정 한도", () => {
    it("당사자 정정도 5회 채웠으면 429 로 막고 요청·각색을 만들지 않는다", async () => {
      const { service, corrections, commandBus } = makeService();
      (corrections.countCorrectionRequestsToday as jest.Mock).mockResolvedValue(
        5,
      );

      await expect(
        service.requestCorrection("u1", "a1", {
          isSubject: true,
          correctionText: "사실 9시 58분 도착",
        }),
      ).rejects.toMatchObject({ status: 429 });

      expect(corrections.createCorrectionRequest).not.toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it("제3자 정정도 5회 채웠으면 429 로 막는다", async () => {
      const { service, corrections } = makeService();
      (corrections.countCorrectionRequestsToday as jest.Mock).mockResolvedValue(
        5,
      );

      await expect(
        service.requestCorrection("u1", "a1", {
          isSubject: false,
          correctionText: "그건 사실이 아니다",
        }),
      ).rejects.toMatchObject({ status: 429 });
    });

    it("삭제 요청은 정정 한도와 무관하다", async () => {
      const { service, corrections } = makeService();
      (corrections.countCorrectionRequestsToday as jest.Mock).mockResolvedValue(
        5,
      );

      await expect(service.requestDeletion("u1", "a1")).resolves.toBeDefined();
    });
  });

  // 각색이 실패했는데 요청 행이 남으면, 한 번도 성공 못 한 사람이 하루 한도를 다 잃는다.
  describe("각색 실패", () => {
    it("각색이 실패하면 정정 요청을 기록하지 않는다", async () => {
      const { service, corrections, commandBus } = makeService();
      (commandBus.execute as jest.Mock).mockRejectedValue(
        new Error("ai_unavailable"),
      );

      await expect(
        service.requestCorrection("u1", "a1", {
          isSubject: true,
          correctionText: "사실 9시 58분 도착",
        }),
      ).rejects.toThrow();

      expect(corrections.createCorrectionRequest).not.toHaveBeenCalled();
    });

    it("제3자 정정도 각색이 실패하면 요청을 기록하지 않는다", async () => {
      const { service, corrections, commandBus } = makeService();
      (commandBus.execute as jest.Mock).mockRejectedValue(
        new Error("ai_unavailable"),
      );

      await expect(
        service.requestCorrection("u1", "a1", {
          isSubject: false,
          correctionText: "그건 사실이 아니다",
        }),
      ).rejects.toThrow();

      expect(corrections.createCorrectionRequest).not.toHaveBeenCalled();
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
        new AdaptContentCommand("g1", "그건 사실이 아니다", OUTLET_KEYS),
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
