import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { Json } from "@/infra/supabase/database.types";

import type { DraftArticle } from "./adaptation/adaptation.types";

/** reports 한 행(초안 캐시 포함). */
export interface ReportRow {
  id: string;
  group_id: string;
  reporter_id: string;
  raw_text: string;
  status: string;
  draft_articles: DraftArticle[] | null;
  created_at: string;
}

/** articles 한 행. */
export interface ArticleRow {
  id: string;
  report_id: string;
  group_id: string;
  outlet_key: string;
  headline: string;
  body: string;
  reporter_name: string;
  published_at: string;
  is_correction: boolean;
  corrects_article_id: string | null;
  is_active: boolean;
  created_at: string;
}

const REPORT_COLUMNS =
  "id, group_id, reporter_id, raw_text, status, draft_articles, created_at";

@Injectable()
export class ReportsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async createReport(input: {
    groupId: string;
    reporterId: string;
    rawText: string;
    photoUrl: string | null;
  }): Promise<ReportRow> {
    const { data, error } = await this.supabase.client
      .from("reports")
      .insert({
        group_id: input.groupId,
        reporter_id: input.reporterId,
        raw_text: input.rawText,
        photo_url: input.photoUrl,
      })
      .select(REPORT_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as ReportRow;
  }

  /**
   * 일간 제보 한도 카운트 — 본인이 직접 낸 제보(제3자 정정 파생 제외)만,
   * `sinceIso`(KST 오늘 시작) 이후 행 수. data-model.md "하루 제보 한도" 참조.
   */
  async countReportsToday(
    reporterId: string,
    sinceIso: string,
  ): Promise<number> {
    const { count, error } = await this.supabase.client
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", reporterId)
      .is("parent_article_id", null)
      .gte("created_at", sinceIso);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async getReport(id: string): Promise<ReportRow | null> {
    const { data, error } = await this.supabase.client
      .from("reports")
      .select(REPORT_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as ReportRow | null) ?? null;
  }

  async saveDraft(reportId: string, drafts: DraftArticle[]): Promise<void> {
    const { error } = await this.supabase.client
      .from("reports")
      .update({
        draft_articles: drafts as unknown as Json,
        draft_generated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      throw error;
    }
  }

  /** 선택 outlet 을 원자적으로 발행(초안 → articles 승격 + status=published). */
  async publishReport(
    reportId: string,
    outletKeys: string[],
  ): Promise<ArticleRow[]> {
    const { data, error } = await this.supabase.client.rpc("publish_report", {
      p_report_id: reportId,
      p_outlet_keys: outletKeys,
    });

    if (error) {
      throw error;
    }

    return (data as ArticleRow[] | null) ?? [];
  }
}
