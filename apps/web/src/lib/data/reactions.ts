/**
 * 반응 데이터 접근 계층 (reactions-comments.md).
 * 멱등 토글: PUT=누름, DELETE=취소. 둘 다 갱신된 집계를 돌려준다.
 * (반응 상수 자체는 `@/lib/reactions` — 여긴 API 호출만.)
 */

import { apiClient } from "@/lib/api/client";
import type { ReactionState } from "@/lib/api/types";
import type { ReactionType } from "@/lib/reactions";

export interface ReactionParams {
  articleId: string;
  reactionType: ReactionType;
}

/** 반응 누름(멱등 — 이미 있으면 그대로). */
export async function addReaction({
  articleId,
  reactionType,
}: ReactionParams): Promise<ReactionState> {
  const { data } = await apiClient.put<ReactionState>(
    `/articles/${articleId}/reactions/${reactionType}`,
  );
  return data;
}

/** 반응 취소(멱등 — 없어도 성공). */
export async function removeReaction({
  articleId,
  reactionType,
}: ReactionParams): Promise<ReactionState> {
  const { data } = await apiClient.delete<ReactionState>(
    `/articles/${articleId}/reactions/${reactionType}`,
  );
  return data;
}
