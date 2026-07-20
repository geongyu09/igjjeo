import { Injectable } from "@nestjs/common";

import type { ArticleRow } from "@/articles/articles.repository";
import type { DraftArticle } from "@/reports/adaptation/adaptation.types";
import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { Json } from "@/infra/supabase/database.types";

@Injectable()
export class CorrectionsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** 삭제 요청(기록 + 원 기사 소프트 다운). 반환: { article_id, is_active:false }. */
  async requestDeletion(articleId: string, userId: string): Promise<Json> {
    const { data, error } = await this.supabase.client.rpc("request_deletion", {
      p_article_id: articleId,
      p_requested_by: userId,
    });

    if (error) {
      throw error;
    }

    return data as Json;
  }

  /**
   * 기사를 올린 제보자 id. 삭제 요청 소유권 검사용 — 기사에는 소유자 컬럼이
   * 없고 원 제보(reports.reporter_id)에만 있으므로 report_id 로 되짚는다.
   */
  async findReporterId(reportId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from("reports")
      .select("reporter_id")
      .eq("id", reportId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as { reporter_id: string } | null)?.reporter_id ?? null;
  }

  /**
   * 일간 정정 한도 카운트 — 본인이 낸 정정 요청(당사자·제3자 모두), `sinceIso`
   * (KST 오늘 시작) 이후 행 수. data-model.md "하루 정정 한도" 참조.
   */
  async countCorrectionRequestsToday(
    userId: string,
    sinceIso: string,
  ): Promise<number> {
    const { count, error } = await this.supabase.client
      .from("correction_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_by", userId)
      .gte("created_at", sinceIso);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  /** 정정 요청 기록. 반환: 요청 id. */
  async createCorrectionRequest(input: {
    articleId: string;
    userId: string;
    isSubject: boolean;
    correctionText: string;
  }): Promise<string> {
    const { data, error } = await this.supabase.client
      .from("correction_requests")
      .insert({
        article_id: input.articleId,
        requested_by: input.userId,
        is_subject: input.isSubject,
        correction_text: input.correctionText,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return (data as { id: string }).id;
  }

  /** 당사자 정정: 정정 기사 1건을 원 기사와 같은 묶음에 얹는다(원 기사 유지). */
  async insertSubjectCorrection(input: {
    reportId: string;
    groupId: string;
    outletKey: string;
    headline: string;
    body: string;
    reporterName: string;
    correctsArticleId: string;
  }): Promise<ArticleRow> {
    const { data, error } = await this.supabase.client.rpc(
      "insert_subject_correction",
      {
        p_report_id: input.reportId,
        p_group_id: input.groupId,
        p_outlet_key: input.outletKey,
        p_headline: input.headline,
        p_body: input.body,
        p_reporter_name: input.reporterName,
        p_corrects_article_id: input.correctsArticleId,
      },
    );

    if (error) {
      throw error;
    }

    const row = (data as ArticleRow[] | null)?.[0];
    if (!row) {
      throw new Error("insert_subject_correction 가 행을 반환하지 않았습니다");
    }
    return row;
  }

  /** 제3자 정정: 원 기사를 부모로 하는 새 제보를 즉시 발행하고 기사 배열을 반환. */
  async publishThirdPartyCorrection(input: {
    groupId: string;
    reporterId: string;
    parentArticleId: string;
    rawText: string;
    articles: DraftArticle[];
  }): Promise<ArticleRow[]> {
    const { data, error } = await this.supabase.client.rpc(
      "publish_third_party_correction",
      {
        p_group_id: input.groupId,
        p_reporter_id: input.reporterId,
        p_parent_article_id: input.parentArticleId,
        p_raw_text: input.rawText,
        p_articles: input.articles as unknown as Json,
      },
    );

    if (error) {
      throw error;
    }

    return (data as ArticleRow[] | null) ?? [];
  }
}
