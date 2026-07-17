import { BadRequestException, Injectable } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";
import type { Json } from "@/infra/supabase/database.types";

import { isReactionType } from "./reaction.types";
import { ReactionsRepository } from "./reactions.repository";

/**
 * 반응 멱등 토글(reactions-comments.md). PUT=누름/DELETE=취소.
 * 응답은 항상 갱신된 집계 + 내 반응(피드/상세와 동일 형태).
 */
@Injectable()
export class ReactionsService {
  constructor(
    private readonly reactions: ReactionsRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async add(userId: string, articleId: string, type: string): Promise<Json> {
    const reactionType = this.parseType(type);
    await this.queryBus.execute(new GetArticleAccessQuery(userId, articleId));
    await this.reactions.add(articleId, userId, reactionType);
    return this.reactions.getState(articleId, userId);
  }

  async remove(userId: string, articleId: string, type: string): Promise<Json> {
    const reactionType = this.parseType(type);
    await this.queryBus.execute(new GetArticleAccessQuery(userId, articleId));
    await this.reactions.remove(articleId, userId, reactionType);
    return this.reactions.getState(articleId, userId);
  }

  private parseType(type: string) {
    if (!isReactionType(type)) {
      throw new BadRequestException({
        error: {
          code: "validation_failed",
          message: "지원하지 않는 반응 종류입니다",
          details: { reaction_type: type },
        },
      });
    }
    return type;
  }
}
