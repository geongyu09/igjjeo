import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import {
  DAILY_REPORT_LIMIT,
  dailyLimitExceeded,
  startOfSeoulDay,
} from "@/common/daily-limit";
import { FindMembershipQuery } from "@/groups/cqrs/find-membership.query";

import { AdaptationService } from "./adaptation/adaptation.service";
import type { DraftArticle, OutletKey } from "./adaptation/adaptation.types";
import {
  ReportsRepository,
  type ArticleRow,
  type ReportRow,
} from "./reports.repository";

export interface CreateReportInput {
  rawText: string;
  photoUrl?: string | null;
  outletKeys?: OutletKey[];
  isSelfReport?: boolean;
}

export interface ReportSummary {
  id: string;
  status: string;
  created_at: string;
}

export interface ArticleResponse {
  id: string;
  report_id: string;
  outlet_key: string;
  headline: string;
  body: string;
  reporter_name: string;
  published_at: string;
  is_active: boolean;
}

export interface ReportDraftResponse {
  report: ReportSummary;
  draft_articles: DraftArticle[];
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly queryBus: QueryBus,
    private readonly adaptation: AdaptationService,
  ) {}

  async createReport(
    userId: string,
    groupId: string,
    input: CreateReportInput,
  ): Promise<ReportDraftResponse> {
    const membership = await this.queryBus.execute(
      new FindMembershipQuery(groupId, userId),
    );
    if (!membership) {
      throw notFound();
    }

    // 일간 제보 한도 — 각색·row 생성 전에 선제 차단(product.md "하루 제보·정정 한도").
    const usedToday = await this.reports.countReportsToday(
      userId,
      startOfSeoulDay(new Date()),
    );
    if (usedToday >= DAILY_REPORT_LIMIT) {
      throw dailyLimitExceeded("report_daily", DAILY_REPORT_LIMIT);
    }

    const report = await this.reports.createReport({
      groupId,
      reporterId: userId,
      rawText: input.rawText,
      photoUrl: input.photoUrl ?? null,
    });

    const drafts = await this.adaptation.adapt(
      groupId,
      input.rawText,
      input.outletKeys ?? [],
      { isSelfReport: input.isSelfReport ?? false },
    );
    await this.reports.saveDraft(report.id, drafts);

    return { report: toSummary(report), draft_articles: drafts };
  }

  async regenerate(
    userId: string,
    reportId: string,
    outletKeys: OutletKey[] | undefined,
  ): Promise<ReportDraftResponse> {
    const report = await this.loadOwnedDraft(userId, reportId);

    const drafts = await this.adaptation.adapt(
      report.group_id,
      report.raw_text,
      outletKeys ?? [],
    );
    await this.reports.saveDraft(report.id, drafts);

    return { report: toSummary(report), draft_articles: drafts };
  }

  async publish(
    userId: string,
    reportId: string,
    outletKeys: OutletKey[],
  ): Promise<{ articles: ArticleResponse[] }> {
    const report = await this.loadOwnedDraft(userId, reportId);

    const cached = report.draft_articles ?? [];
    if (cached.length === 0) {
      throw new ConflictException({
        error: { code: "conflict", message: "발행할 초안이 없습니다" },
      });
    }

    const available = new Set(cached.map((d) => d.outlet_key));
    const invalid = outletKeys.filter((k) => !available.has(k));
    if (outletKeys.length === 0 || invalid.length > 0) {
      throw new BadRequestException({
        error: {
          code: "validation_failed",
          message: "초안에 없는 언론사를 선택했습니다",
          details: { invalid },
        },
      });
    }

    const articles = await this.reports.publishReport(reportId, outletKeys);
    return { articles: articles.map(toArticleResponse) };
  }

  async getReport(
    userId: string,
    reportId: string,
  ): Promise<ReportDraftResponse> {
    const report = await this.loadOwned(userId, reportId);
    return {
      report: toSummary(report),
      draft_articles: report.draft_articles ?? [],
    };
  }

  private async loadOwned(
    userId: string,
    reportId: string,
  ): Promise<ReportRow> {
    const report = await this.reports.getReport(reportId);
    // 미발행 초안은 제보자 본인에게만 존재한다 — 그 외에는 존재를 숨겨 404.
    if (!report) {
      throw notFound();
    }
    const membership = await this.queryBus.execute(
      new FindMembershipQuery(report.group_id, userId),
    );
    if (!membership || report.reporter_id !== userId) {
      throw notFound();
    }
    return report;
  }

  private async loadOwnedDraft(
    userId: string,
    reportId: string,
  ): Promise<ReportRow> {
    const report = await this.loadOwned(userId, reportId);
    if (report.status !== "draft") {
      throw new ConflictException({
        error: { code: "conflict", message: "이미 발행된 제보입니다" },
      });
    }
    return report;
  }
}

function toSummary(report: ReportRow): ReportSummary {
  return {
    id: report.id,
    status: report.status,
    created_at: report.created_at,
  };
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
    is_active: row.is_active,
  };
}

function notFound(): NotFoundException {
  return new NotFoundException({
    error: { code: "not_found", message: "제보를 찾을 수 없습니다" },
  });
}
