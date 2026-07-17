import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";

import { GroupsRepository } from "@/groups/groups.repository";

import { AdaptationUnavailableError } from "./adaptation/adaptation.logic";
import {
  ADAPTATION_PORT,
  type AdaptationPort,
  type DraftArticle,
  type OutletKey,
} from "./adaptation/adaptation.types";
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
    private readonly groups: GroupsRepository,
    @Inject(ADAPTATION_PORT) private readonly adaptation: AdaptationPort,
  ) {}

  async createReport(
    userId: string,
    groupId: string,
    input: CreateReportInput,
  ): Promise<ReportDraftResponse> {
    const membership = await this.groups.findMembership(groupId, userId);
    if (!membership) {
      throw notFound();
    }

    const report = await this.reports.createReport({
      groupId,
      reporterId: userId,
      rawText: input.rawText,
      photoUrl: input.photoUrl ?? null,
    });

    const drafts = await this.adapt(
      groupId,
      input.rawText,
      input.outletKeys ?? [],
      input.isSelfReport ?? false,
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

    const drafts = await this.adapt(
      report.group_id,
      report.raw_text,
      outletKeys ?? [],
      false,
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

  /** 각색 실행: 방 멤버 매칭으로 실명→마스킹 subjects 구성 후 어댑터 호출. */
  private async adapt(
    groupId: string,
    rawText: string,
    outletKeys: OutletKey[],
    isSelfReport: boolean,
  ): Promise<DraftArticle[]> {
    const subjects = await this.resolveSubjects(groupId, rawText);

    let result;
    try {
      result = await this.adaptation.adaptReport({
        rawText,
        outletKeys,
        subjects,
        isSelfReport,
      });
    } catch (err) {
      if (err instanceof AdaptationUnavailableError) {
        throw new ServiceUnavailableException({
          error: {
            code: "ai_unavailable",
            message: "각색 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요",
          },
        });
      }
      throw err;
    }

    if (result.status === "refused") {
      throw new UnprocessableEntityException({
        error: {
          code: "adaptation_refused",
          message: result.message,
          details: { reason: result.reason },
        },
      });
    }

    return result.articles;
  }

  private async resolveSubjects(
    groupId: string,
    rawText: string,
  ): Promise<{ rawName: string; maskedName: string }[]> {
    const members = await this.groups.listMembers(groupId);
    return members
      .filter((m) => m.display_name && rawText.includes(m.display_name))
      .map((m) => ({ rawName: m.display_name, maskedName: m.masked_name }));
  }

  private async loadOwned(userId: string, reportId: string): Promise<ReportRow> {
    const report = await this.reports.getReport(reportId);
    // 미발행 초안은 제보자 본인에게만 존재한다 — 그 외에는 존재를 숨겨 404.
    if (!report) {
      throw notFound();
    }
    const membership = await this.groups.findMembership(
      report.group_id,
      userId,
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
  return { id: report.id, status: report.status, created_at: report.created_at };
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
