import { ForbiddenException, Injectable } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";
import type { ArticleRow } from "@/articles/articles.repository";
import {
  DAILY_CORRECTION_LIMIT,
  dailyLimitExceeded,
  startOfSeoulDay,
} from "@/common/daily-limit";
import { AdaptContentCommand } from "@/reports/adaptation/adapt-content.command";
import {
  OUTLET_KEYS,
  type OutletKey,
} from "@/reports/adaptation/adaptation.types";
import type { Json } from "@/infra/supabase/database.types";

import { CorrectionsRepository } from "./corrections.repository";

export interface CorrectionRequestInput {
  isSubject: boolean;
  correctionText: string;
}

export interface ArticleResponse {
  id: string;
  report_id: string;
  outlet_key: string;
  headline: string;
  body: string;
  reporter_name: string;
  published_at: string;
  is_correction: boolean;
  corrects_article_id: string | null;
  is_active: boolean;
}

export type CorrectionResult =
  | { correction_request_id: string; article: ArticleResponse }
  | {
      correction_request_id: string;
      report_id: string;
      articles: ArticleResponse[];
    };

/**
 * 정정·삭제(corrections-deletion.md). 삭제는 소프트 다운, 정정은 당사자/제3자로 분기한다.
 * - 당사자 정정: 원 기사 유지 + 정정 기사 1건(같은 outlet, corrects_article_id 연결).
 * - 제3자 정정: 원 기사 유지 + 새 제보(parent_article_id)에서 언론사 수만큼 새 기사.
 */
@Injectable()
export class CorrectionsService {
  constructor(
    private readonly corrections: CorrectionsRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 기사 내리기 — **기사를 올린 제보자 본인만** 할 수 있다(이유 불요, 즉시 소프트 다운).
   * 방 격리와 무관한 소유권 실패이므로 404 가 아니라 403 으로 돌려준다(conventions.md §3).
   */
  async requestDeletion(userId: string, articleId: string): Promise<Json> {
    const article = await this.queryBus.execute(
      new GetArticleAccessQuery(userId, articleId, true),
    );

    // 정정 기사는 원 기사와 report_id 를 공유한다 — 제보자를 소유자로 보면 반박당한 쪽이
    // 남의 반박을 내릴 수 있게 되므로, 정정 기사는 누구도 내리지 못한다(반박은 기록으로 남는다).
    if (article.is_correction) {
      throw forbidden("정정 기사는 내릴 수 없어요");
    }

    const reporterId = await this.corrections.findReporterId(article.report_id);
    if (reporterId !== userId) {
      throw forbidden("기사를 올린 사람만 내릴 수 있어요");
    }

    return this.corrections.requestDeletion(articleId, userId);
  }

  async requestCorrection(
    userId: string,
    articleId: string,
    input: CorrectionRequestInput,
  ): Promise<CorrectionResult> {
    const article = await this.queryBus.execute(
      new GetArticleAccessQuery(userId, articleId),
    );

    // 일간 정정 한도 — 요청 기록·각색 전에 선제 차단(product.md "하루 제보·정정 한도").
    const usedToday = await this.corrections.countCorrectionRequestsToday(
      userId,
      startOfSeoulDay(new Date()),
    );
    if (usedToday >= DAILY_CORRECTION_LIMIT) {
      throw dailyLimitExceeded("correction_daily", DAILY_CORRECTION_LIMIT);
    }

    return input.isSubject
      ? this.applySubjectCorrection(userId, article, input.correctionText)
      : this.applyThirdPartyCorrection(userId, article, input.correctionText);
  }

  /**
   * 정정 요청 기록 — **각색이 성공한 뒤에만** 남긴다. 각색 실패(422·503)로도 행이 쌓이면
   * 기사를 한 건도 얻지 못한 사람이 하루 정정 한도를 다 잃는다.
   */
  private recordRequest(
    userId: string,
    articleId: string,
    isSubject: boolean,
    correctionText: string,
  ): Promise<string> {
    return this.corrections.createCorrectionRequest({
      articleId,
      userId,
      isSubject,
      correctionText,
    });
  }

  /** 당사자 정정: 원 기사와 같은 outlet 으로 "정정합니다" 기사 1건을 얹는다. */
  private async applySubjectCorrection(
    userId: string,
    article: {
      id: string;
      group_id: string;
      report_id: string;
      outlet_key: string;
    },
    correctionText: string,
  ): Promise<CorrectionResult> {
    const drafts = await this.commandBus.execute(
      new AdaptContentCommand(
        article.group_id,
        correctionText,
        [article.outlet_key as OutletKey],
        { isSelfReport: true, isCorrection: true },
      ),
    );
    const draft = drafts[0];

    const requestId = await this.recordRequest(
      userId,
      article.id,
      true,
      correctionText,
    );

    const row = await this.corrections.insertSubjectCorrection({
      reportId: article.report_id,
      groupId: article.group_id,
      outletKey: draft.outlet_key,
      headline: draft.headline,
      body: draft.body,
      reporterName: draft.reporter_name,
      correctsArticleId: article.id,
    });

    return {
      correction_request_id: requestId,
      article: toArticleResponse(row),
    };
  }

  /** 제3자 정정: 원 기사를 부모로 하는 새 제보를 언론사 수만큼 즉시 발행한다. */
  private async applyThirdPartyCorrection(
    userId: string,
    article: { id: string; group_id: string },
    correctionText: string,
  ): Promise<CorrectionResult> {
    const drafts = await this.commandBus.execute(
      new AdaptContentCommand(article.group_id, correctionText, OUTLET_KEYS),
    );

    const requestId = await this.recordRequest(
      userId,
      article.id,
      false,
      correctionText,
    );

    const rows = await this.corrections.publishThirdPartyCorrection({
      groupId: article.group_id,
      reporterId: userId,
      parentArticleId: article.id,
      rawText: correctionText,
      articles: drafts,
    });

    return {
      correction_request_id: requestId,
      report_id: rows[0]?.report_id ?? "",
      articles: rows.map(toArticleResponse),
    };
  }
}

function forbidden(message: string): ForbiddenException {
  return new ForbiddenException({
    error: { code: "forbidden", message },
  });
}

function toArticleResponse(row: ArticleRow): ArticleResponse {
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
    is_active: row.is_active,
  };
}
