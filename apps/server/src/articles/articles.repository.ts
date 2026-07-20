import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { Json } from "@/infra/supabase/database.types";

/** 방-스코프 인가에 필요한 기사 최소 정보(그룹·상태·정정 포인터). */
export interface ArticleAccess {
  id: string;
  group_id: string;
  report_id: string;
  outlet_key: string;
  is_active: boolean;
  is_correction: boolean;
  corrects_article_id: string | null;
}

/** article_correction_chain 이 돌려주는 기사 한 행. */
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

/** list_group_feed 한 행(묶음). bundle 은 이미 화면용으로 직렬화된 JSON. */
export interface FeedRow {
  report_id: string;
  bundle_at: string;
  bundle: Json;
}

const ACCESS_COLUMNS =
  "id, group_id, report_id, outlet_key, is_active, is_correction, corrects_article_id";

@Injectable()
export class ArticlesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** 인가용 기사 조회. 없으면 null. */
  async getArticleAccess(articleId: string): Promise<ArticleAccess | null> {
    const { data, error } = await this.supabase.client
      .from("articles")
      .select(ACCESS_COLUMNS)
      .eq("id", articleId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as ArticleAccess | null) ?? null;
  }

  /** 방 피드(제보 묶음 단위, 최신순). 반응·댓글 집계는 RPC 안에서 완성된다. */
  async getFeed(
    groupId: string,
    userId: string,
    limit: number,
    before: string | null,
  ): Promise<FeedRow[]> {
    const { data, error } = await this.supabase.client.rpc("list_group_feed", {
      p_group_id: groupId,
      p_user_id: userId,
      p_limit: limit,
      p_before: before,
    });

    if (error) {
      throw error;
    }

    return (data as FeedRow[] | null) ?? [];
  }

  /** 기사 상세(활성 기사만, 정정 연쇄 포함). 없거나 비활성이면 null. */
  async getArticleDetail(
    articleId: string,
    userId: string,
  ): Promise<Json | null> {
    const { data, error } = await this.supabase.client.rpc(
      "get_article_detail",
      { p_article_id: articleId, p_user_id: userId },
    );

    if (error) {
      throw error;
    }

    return (data as Json | null) ?? null;
  }

  /** 정정 연쇄 전체(최초 기사 → 최신 정정, 시간순). 인자 기사도 포함된다. */
  async getCorrectionChain(articleId: string): Promise<ArticleRow[]> {
    const { data, error } = await this.supabase.client.rpc(
      "article_correction_chain",
      { p_article_id: articleId },
    );

    if (error) {
      throw error;
    }

    return (data as ArticleRow[] | null) ?? [];
  }
}
