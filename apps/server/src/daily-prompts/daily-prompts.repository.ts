import { Injectable } from "@nestjs/common";

import type { DraftArticle } from "@/reports/adaptation/adaptation.types";
import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { Json } from "@/infra/supabase/database.types";

/** get_daily_prompt 가 돌려주는 프롬프트 뷰(내 답변 여부 포함). */
export interface PromptView {
  id: string;
  question: string;
  date: string;
  answer_count: number;
  answered_by_me: boolean;
  published_report_id: string | null;
}

/** daily_prompts 한 행(발행 판정용). */
export interface PromptRow {
  id: string;
  group_id: string;
  question: string;
  date: string;
  published_report_id: string | null;
  created_at: string;
}

@Injectable()
export class DailyPromptsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** 오늘(지정일) 프롬프트 + 내 답변 여부. 없으면 null. */
  async getPrompt(
    groupId: string,
    date: string,
    userId: string,
  ): Promise<PromptView | null> {
    const { data, error } = await this.supabase.client.rpc("get_daily_prompt", {
      p_group_id: groupId,
      p_date: date,
      p_user_id: userId,
    });

    if (error) {
      throw error;
    }

    return (data as unknown as PromptView | null) ?? null;
  }

  /** 발행 판정용 프롬프트 행. 없으면 null. */
  async getById(promptId: string): Promise<PromptRow | null> {
    const { data, error } = await this.supabase.client
      .from("daily_prompts")
      .select("id, group_id, question, date, published_report_id, created_at")
      .eq("id", promptId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as PromptRow | null) ?? null;
  }

  /** 프롬프트 답변(사용자당 1건, 재제출은 갱신). */
  async upsertAnswer(
    promptId: string,
    userId: string,
    answerText: string,
  ): Promise<Json> {
    const { data, error } = await this.supabase.client.rpc(
      "upsert_prompt_answer",
      { p_prompt_id: promptId, p_user_id: userId, p_answer_text: answerText },
    );

    if (error) {
      throw error;
    }

    return data as Json;
  }

  /** 발행 대상 답변들(원문 집계용). */
  async listAnswers(promptId: string): Promise<{ answer_text: string }[]> {
    const { data, error } = await this.supabase.client
      .from("daily_prompt_answers")
      .select("answer_text")
      .eq("prompt_id", promptId);

    if (error) {
      throw error;
    }

    return (data as { answer_text: string }[] | null) ?? [];
  }

  /** 프롬프트 시딩(방·날짜당 1건). */
  async create(
    groupId: string,
    question: string,
    date: string,
  ): Promise<PromptRow> {
    const { data, error } = await this.supabase.client
      .from("daily_prompts")
      .insert({ group_id: groupId, question, date })
      .select("id, group_id, question, date, published_report_id, created_at")
      .single();

    if (error) {
      throw error;
    }

    return data as PromptRow;
  }

  /** 모인 답변을 제보로 전환 → 즉시 발행. { report_id, articles } 반환. */
  async publish(input: {
    promptId: string;
    groupId: string;
    reporterId: string;
    rawText: string;
    articles: DraftArticle[];
  }): Promise<Json> {
    const { data, error } = await this.supabase.client.rpc(
      "publish_daily_prompt",
      {
        p_prompt_id: input.promptId,
        p_group_id: input.groupId,
        p_reporter_id: input.reporterId,
        p_raw_text: input.rawText,
        p_articles: input.articles as unknown as Json,
      },
    );

    if (error) {
      throw error;
    }

    return data as Json;
  }
}
