import { type IQueryHandler, Query, QueryHandler } from "@nestjs/cqrs";

import { ArticleAccessService } from "../article-access.service";
import type { ArticleAccess } from "../articles.repository";

export type { ArticleAccess } from "../articles.repository";

/**
 * 기사-스코프 인가(RLS 대체). articleId 로 기사의 방을 찾아 요청자 멤버십을 검사하고,
 * 실패 시 404 로 존재를 숨긴다. reactions·comments·corrections 가 ArticlesModule 을
 * 직접 의존하는 대신 이 쿼리를 QueryBus 로 보낸다.
 */
export class GetArticleAccessQuery extends Query<ArticleAccess> {
  constructor(
    readonly userId: string,
    readonly articleId: string,
    readonly requireActive = false,
  ) {
    super();
  }
}

@QueryHandler(GetArticleAccessQuery)
export class GetArticleAccessHandler implements IQueryHandler<
  GetArticleAccessQuery,
  ArticleAccess
> {
  constructor(private readonly access: ArticleAccessService) {}

  execute(query: GetArticleAccessQuery): Promise<ArticleAccess> {
    return this.access.assertMember(query.userId, query.articleId, {
      requireActive: query.requireActive,
    });
  }
}
