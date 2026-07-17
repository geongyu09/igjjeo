import { Injectable, NotFoundException } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import { FindMembershipQuery } from "@/groups/cqrs/find-membership.query";

import { ArticlesRepository, type ArticleAccess } from "./articles.repository";

/**
 * 기사-스코프 인가의 공통 봉합선(RLS 대체, conventions.md §3). articleId 만 있는
 * 라우트(reactions·comments·corrections·상세)는 이 한 곳으로 기사의 group_id 를 찾아
 * 요청자의 멤버십을 검사하고, 실패 시 404 로 존재를 숨긴다.
 */
@Injectable()
export class ArticleAccessService {
  constructor(
    private readonly articles: ArticlesRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async assertMember(
    userId: string,
    articleId: string,
    options: { requireActive?: boolean } = {},
  ): Promise<ArticleAccess> {
    const article = await this.articles.getArticleAccess(articleId);
    if (!article) {
      throw notFound();
    }
    // 비활성(삭제된) 기사는 조회 계열에서 존재를 숨긴다(반응/댓글/정정은 허용 여지).
    if (options.requireActive && !article.is_active) {
      throw notFound();
    }

    const membership = await this.queryBus.execute(
      new FindMembershipQuery(article.group_id, userId),
    );
    if (!membership) {
      throw notFound();
    }

    return article;
  }
}

function notFound(): NotFoundException {
  return new NotFoundException({
    error: { code: "not_found", message: "기사를 찾을 수 없습니다" },
  });
}
