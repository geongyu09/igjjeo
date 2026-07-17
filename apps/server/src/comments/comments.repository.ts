import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";

/** 댓글 한 행(작성자 masked_name 포함). */
export interface CommentRow {
  id: string;
  masked_name: string;
  body: string;
  created_at: string;
}

/** 삭제 인가용 댓글 소유 정보. */
export interface CommentOwner {
  id: string;
  user_id: string;
  article_id: string;
}

@Injectable()
export class CommentsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** 댓글 목록(created_at 오름차순 = 대화 흐름). after 이후만. */
  async list(
    articleId: string,
    limit: number,
    after: string | null,
  ): Promise<CommentRow[]> {
    const { data, error } = await this.supabase.client.rpc(
      "list_article_comments",
      { p_article_id: articleId, p_limit: limit, p_after: after },
    );

    if (error) {
      throw error;
    }

    return (data as CommentRow[] | null) ?? [];
  }

  /** 댓글 작성(작성자 masked_name 을 함께 반환). */
  async create(
    articleId: string,
    userId: string,
    body: string,
  ): Promise<CommentRow> {
    const { data, error } = await this.supabase.client.rpc("create_comment", {
      p_article_id: articleId,
      p_user_id: userId,
      p_body: body,
    });

    if (error) {
      throw error;
    }

    const row = (data as CommentRow[] | null)?.[0];
    if (!row) {
      throw new Error("create_comment 가 행을 반환하지 않았습니다");
    }
    return row;
  }

  /** 삭제 인가용 소유 정보. 없으면 null. */
  async getOwner(commentId: string): Promise<CommentOwner | null> {
    const { data, error } = await this.supabase.client
      .from("comments")
      .select("id, user_id, article_id")
      .eq("id", commentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as CommentOwner | null) ?? null;
  }

  async delete(commentId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      throw error;
    }
  }
}
