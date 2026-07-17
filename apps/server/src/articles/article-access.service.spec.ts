import { NotFoundException } from "@nestjs/common";
import type { QueryBus } from "@nestjs/cqrs";

import { FindMembershipQuery } from "@/groups/cqrs/find-membership.query";

import { ArticleAccessService } from "./article-access.service";
import type { ArticleAccess, ArticlesRepository } from "./articles.repository";

const articleAccess: ArticleAccess = {
  id: "a1",
  group_id: "g1",
  report_id: "r1",
  outlet_key: "daily",
  is_active: true,
  is_correction: false,
  corrects_article_id: null,
};

function makeService() {
  const articles = {
    getArticleAccess: jest.fn().mockResolvedValue(articleAccess),
  } as unknown as jest.Mocked<ArticlesRepository>;
  const queryBus = {
    execute: jest.fn().mockResolvedValue({ role: "member" }),
  } as unknown as jest.Mocked<QueryBus>;
  return {
    service: new ArticleAccessService(articles, queryBus),
    articles,
    queryBus,
  };
}

describe("ArticleAccessService", () => {
  it("기사가 없으면 404", async () => {
    const { service, articles } = makeService();
    (articles.getArticleAccess as jest.Mock).mockResolvedValue(null);

    await expect(service.assertMember("u1", "a1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("방 멤버가 아니면 404(존재 은닉)", async () => {
    const { service, queryBus } = makeService();
    (queryBus.execute as jest.Mock).mockResolvedValue(null);

    await expect(service.assertMember("u1", "a1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("requireActive 인데 비활성 기사면 404", async () => {
    const { service, articles } = makeService();
    (articles.getArticleAccess as jest.Mock).mockResolvedValue({
      ...articleAccess,
      is_active: false,
    });

    await expect(
      service.assertMember("u1", "a1", { requireActive: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("멤버면 기사의 방으로 멤버십을 조회하고 접근 정보를 반환한다", async () => {
    const { service, queryBus } = makeService();

    await expect(service.assertMember("u1", "a1")).resolves.toEqual(
      articleAccess,
    );
    expect(queryBus.execute).toHaveBeenCalledWith(
      new FindMembershipQuery("g1", "u1"),
    );
  });
});
