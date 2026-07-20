import { Injectable, NotFoundException } from "@nestjs/common";

import { decodeCursor, encodeCursor } from "@/common/cursor";
import type { Json } from "@/infra/supabase/database.types";

import { ArticleAccessService } from "./article-access.service";
import { ArticlesRepository, type ArticleRow } from "./articles.repository";

export interface PageQuery {
  limit?: number;
  cursor?: string;
}

export interface FeedResponse {
  items: Json[];
  next_cursor: string | null;
}

export interface CorrectionSummary {
  id: string;
  report_id: string;
  outlet_key: string;
  headline: string;
  body: string;
  reporter_name: string;
  published_at: string;
  is_correction: boolean;
  corrects_article_id: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class ArticlesService {
  constructor(
    private readonly articles: ArticlesRepository,
    private readonly access: ArticleAccessService,
  ) {}

  /** 방 피드(제보 묶음 최신순, 커서=묶음 대표 시각 bundle_at). */
  async getFeed(
    userId: string,
    groupId: string,
    query: PageQuery,
  ): Promise<FeedResponse> {
    const limit = clampLimit(query.limit);
    const before = decodeCursor(query.cursor);

    const rows = await this.articles.getFeed(
      groupId,
      userId,
      limit + 1,
      before,
    );
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    const nextCursor =
      hasMore && page.length > 0
        ? encodeCursor(page[page.length - 1].bundle_at)
        : null;

    return { items: page.map((r) => r.bundle), next_cursor: nextCursor };
  }

  /** 기사 상세. 비활성/부재 기사는 404 로 숨긴다. */
  async getArticle(userId: string, articleId: string): Promise<Json> {
    await this.access.assertMember(userId, articleId, { requireActive: true });

    const detail = await this.articles.getArticleDetail(articleId, userId);
    if (detail === null) {
      throw notFound();
    }
    return detail;
  }

  /**
   * 정정 연쇄 전체(선택 엔드포인트). 어느 기사에서 물어도 최초 기사부터
   * 시간순 한 줄기로 돌려준다 — 정정 기사에서 열어도 사건의 시작이 보인다.
   */
  async listCorrections(
    userId: string,
    articleId: string,
  ): Promise<{ items: CorrectionSummary[] }> {
    await this.access.assertMember(userId, articleId);
    const chain = await this.articles.getCorrectionChain(articleId);
    return { items: chain.map(toCorrectionSummary) };
  }
}

function toCorrectionSummary(row: ArticleRow): CorrectionSummary {
  return {
    id: row.id,
    report_id: row.report_id,
    outlet_key: row.outlet_key,
    headline: row.headline,
    body: row.body,
    reporter_name: row.reporter_name,
    published_at: row.published_at,
    is_correction: row.is_correction,
    corrects_article_id: row.corrects_article_id,
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
    error: { code: "not_found", message: "기사를 찾을 수 없습니다" },
  });
}
