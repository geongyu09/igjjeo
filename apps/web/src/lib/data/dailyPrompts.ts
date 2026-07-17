/**
 * 데일리 프롬프트 데이터 접근 계층 (daily-prompts.md) — 빈 피드 부트스트랩.
 * 그날 프롬프트가 없으면 서버가 204를 주므로 getDailyPrompt는 null을 반환한다.
 */

import { apiClient } from "@/lib/api/client";
import type {
  Article,
  DailyPrompt,
  DailyPromptAnswerResult,
  PublishResult,
} from "@/lib/api/types";
import { idempotencyHeaders } from "./idempotency";

export interface GetDailyPromptParams {
  groupId: string;
  /** YYYY-MM-DD (미지정 시 방 타임존 기준 오늘) */
  date?: string;
}

/** 오늘(또는 지정일) 프롬프트. 없으면(204) null. */
export async function getDailyPrompt({
  groupId,
  date,
}: GetDailyPromptParams): Promise<DailyPrompt | null> {
  const res = await apiClient.get<DailyPrompt | "">(
    `/groups/${groupId}/daily-prompt`,
    { params: { date } },
  );
  // 204 No Content → 본문 없음
  if (res.status === 204 || !res.data) return null;
  return res.data;
}

export interface AnswerDailyPromptParams {
  groupId: string;
  promptId: string;
  answerText: string;
}

export async function answerDailyPrompt({
  groupId,
  promptId,
  answerText,
}: AnswerDailyPromptParams): Promise<DailyPromptAnswerResult> {
  const { data } = await apiClient.post<DailyPromptAnswerResult>(
    `/groups/${groupId}/daily-prompts/${promptId}/answers`,
    { answer_text: answerText },
  );
  return data;
}

export interface PublishDailyPromptParams {
  groupId: string;
  promptId: string;
  /** 중복 발행 방지 — 멱등 키 필수 */
  idempotencyKey?: string;
}

/** 모인 답변을 제보로 전환 → 각색 → 발행. */
export async function publishDailyPrompt({
  groupId,
  promptId,
  idempotencyKey,
}: PublishDailyPromptParams): Promise<PublishResult> {
  const { data } = await apiClient.post<PublishResult>(
    `/groups/${groupId}/daily-prompts/${promptId}/publish`,
    undefined,
    { headers: idempotencyHeaders(idempotencyKey) },
  );
  return data;
}

export interface SeedDailyPromptParams {
  groupId: string;
  question: string;
  date: string;
}

/** 프롬프트 시딩(시스템/owner). 일반 멤버는 403. */
export async function seedDailyPrompt({
  groupId,
  question,
  date,
}: SeedDailyPromptParams): Promise<DailyPrompt> {
  const { data } = await apiClient.post<DailyPrompt>(
    `/groups/${groupId}/daily-prompts`,
    { question, date },
  );
  return data;
}
