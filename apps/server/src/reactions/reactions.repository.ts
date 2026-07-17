import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { Json } from "@/infra/supabase/database.types";

import type { ReactionType } from "./reaction.types";

@Injectable()
export class ReactionsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** 반응 누름(멱등). 유니크 (article_id, user_id, reaction_type) 로 중복은 무시. */
  async add(
    articleId: string,
    userId: string,
    type: ReactionType,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from("reactions")
      .upsert(
        { article_id: articleId, user_id: userId, reaction_type: type },
        {
          onConflict: "article_id,user_id,reaction_type",
          ignoreDuplicates: true,
        },
      );

    if (error) {
      throw error;
    }
  }

  /** 반응 취소(멱등). 없어도 성공. */
  async remove(
    articleId: string,
    userId: string,
    type: ReactionType,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from("reactions")
      .delete()
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .eq("reaction_type", type);

    if (error) {
      throw error;
    }
  }

  /** 갱신된 집계 + 내 반응(토글 응답용). */
  async getState(articleId: string, userId: string): Promise<Json> {
    const { data, error } = await this.supabase.client.rpc(
      "article_reaction_state",
      { p_article_id: articleId, p_user_id: userId },
    );

    if (error) {
      throw error;
    }

    return data as Json;
  }
}
