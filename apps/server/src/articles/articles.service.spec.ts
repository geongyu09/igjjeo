import { NotFoundException } from "@nestjs/common";

import type { ArticleAccessService } from "./article-access.service";
import type { ArticlesRepository, FeedRow } from "./articles.repository";
import { ArticlesService } from "./articles.service";

function feedRow(reportId: string, at: string): FeedRow {
  return {
    report_id: reportId,
    bundle_at: at,
    bundle: { report_id: reportId, articles: [] },
  };
}

function makeService() {
  const articles = {
    getFeed: jest.fn().mockResolvedValue([]),
    getArticleDetail: jest.fn().mockResolvedValue({ id: "a1" }),
    getCorrectionChain: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<ArticlesRepository>;
  const access = {
    assertMember: jest.fn().mockResolvedValue({ id: "a1", group_id: "g1" }),
  } as unknown as jest.Mocked<ArticleAccessService>;
  return { service: new ArticlesService(articles, access), articles, access };
}

describe("ArticlesService", () => {
  describe("getFeed", () => {
    it("묶음 JSON 을 items 로 반환한다", async () => {
      const { service, articles } = makeService();
      (articles.getFeed as jest.Mock).mockResolvedValue([
        feedRow("r1", "2026-07-17T03:00:00.000Z"),
      ]);

      const result = await service.getFeed("u1", "g1", {});

      expect(result.items).toEqual([{ report_id: "r1", articles: [] }]);
      expect(result.next_cursor).toBeNull();
    });

    it("limit+1 건이면 next_cursor 를 마지막 묶음 시각으로 발급한다", async () => {
      const { service, articles } = makeService();
      const rows = Array.from({ length: 21 }, (_, i) =>
        feedRow(`r${i}`, `2026-07-17T00:00:${String(i).padStart(2, "0")}.000Z`),
      );
      (articles.getFeed as jest.Mock).mockResolvedValue(rows);

      const result = await service.getFeed("u1", "g1", {});

      expect(result.items).toHaveLength(20);
      expect(result.next_cursor).not.toBeNull();
    });

    it("limit 을 서비스가 clamp 하고 +1 조회한다", async () => {
      const { service, articles } = makeService();
      await service.getFeed("u1", "g1", { limit: 5 });
      expect(articles.getFeed).toHaveBeenCalledWith("g1", "u1", 6, null);
    });
  });

  describe("getArticle", () => {
    it("활성 검사를 강제하고 상세를 반환한다", async () => {
      const { service, access } = makeService();

      const result = await service.getArticle("u1", "a1");

      expect(access.assertMember).toHaveBeenCalledWith("u1", "a1", {
        requireActive: true,
      });
      expect(result).toEqual({ id: "a1" });
    });

    it("상세가 null 이면 404", async () => {
      const { service, articles } = makeService();
      (articles.getArticleDetail as jest.Mock).mockResolvedValue(null);

      await expect(service.getArticle("u1", "a1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("listCorrections", () => {
    it("정정 연쇄를 요약 형태로 반환한다", async () => {
      const { service, articles } = makeService();
      (articles.getCorrectionChain as jest.Mock).mockResolvedValue([
        {
          id: "a2",
          report_id: "r2",
          group_id: "g1",
          outlet_key: "daily",
          headline: "정정",
          body: "본문",
          reporter_name: "정확한",
          published_at: "2026-07-17T04:00:00.000Z",
          is_correction: true,
          corrects_article_id: "a1",
          is_active: true,
          created_at: "2026-07-17T04:00:00.000Z",
        },
      ]);

      const result = await service.listCorrections("u1", "a1");

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: "a2",
        corrects_article_id: "a1",
      });
    });
  });
});
