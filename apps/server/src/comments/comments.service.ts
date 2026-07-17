import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";
import { decodeCursor, encodeCursor } from "@/common/cursor";

import { CommentsRepository, type CommentRow } from "./comments.repository";

export interface PageQuery {
  limit?: number;
  cursor?: string;
}

export interface CommentResponse {
  id: string;
  author: { masked_name: string };
  body: string;
  created_at: string;
}

export interface CommentListResponse {
  items: CommentResponse[];
  next_cursor: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class CommentsService {
  constructor(
    private readonly comments: CommentsRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async list(
    userId: string,
    articleId: string,
    query: PageQuery,
  ): Promise<CommentListResponse> {
    await this.queryBus.execute(new GetArticleAccessQuery(userId, articleId));

    const limit = clampLimit(query.limit);
    const after = decodeCursor(query.cursor);

    const rows = await this.comments.list(articleId, limit + 1, after);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    const nextCursor =
      hasMore && page.length > 0
        ? encodeCursor(page[page.length - 1].created_at)
        : null;

    return { items: page.map(toResponse), next_cursor: nextCursor };
  }

  async create(
    userId: string,
    articleId: string,
    body: string,
  ): Promise<CommentResponse> {
    await this.queryBus.execute(new GetArticleAccessQuery(userId, articleId));
    const row = await this.comments.create(articleId, userId, body);
    return toResponse(row);
  }

  async delete(userId: string, commentId: string): Promise<void> {
    const owner = await this.comments.getOwner(commentId);
    if (!owner) {
      throw notFound();
    }
    // 방 밖 리소스는 존재를 숨긴다(404). 멤버지만 타인 댓글이면 권한 문제(403).
    await this.queryBus.execute(
      new GetArticleAccessQuery(userId, owner.article_id),
    );
    if (owner.user_id !== userId) {
      throw new ForbiddenException({
        error: { code: "forbidden", message: "본인 댓글만 삭제할 수 있습니다" },
      });
    }

    await this.comments.delete(commentId);
  }
}

function toResponse(row: CommentRow): CommentResponse {
  return {
    id: row.id,
    author: { masked_name: row.masked_name },
    body: row.body,
    created_at: row.created_at,
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(limit, MAX_LIMIT);
}

function notFound(): NotFoundException {
  return new NotFoundException({
    error: { code: "not_found", message: "댓글을 찾을 수 없습니다" },
  });
}
