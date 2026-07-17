/**
 * 댓글 데이터 접근 계층 (reactions-comments.md).
 * 댓글 작성자는 기사 문맥에선 masked_name으로 표기된다(뉴스 연출 일관성).
 */

import { apiClient } from "@/lib/api/client";
import type { Comment, Paginated, PageParams } from "@/lib/api/types";
import { idempotencyHeaders } from "./idempotency";

export interface ListCommentsParams extends PageParams {
  articleId: string;
}

/** 댓글 목록(기본 created_at 오름차순 — 대화 흐름). */
export async function listComments({
  articleId,
  ...page
}: ListCommentsParams): Promise<Paginated<Comment>> {
  const { data } = await apiClient.get<Paginated<Comment>>(
    `/articles/${articleId}/comments`,
    { params: page },
  );
  return data;
}

export interface CreateCommentParams {
  articleId: string;
  body: string;
  idempotencyKey?: string;
}

export async function createComment({
  articleId,
  body,
  idempotencyKey,
}: CreateCommentParams): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(
    `/articles/${articleId}/comments`,
    { body },
    { headers: idempotencyHeaders(idempotencyKey) },
  );
  return data;
}

export interface DeleteCommentParams {
  commentId: string;
}

/** 댓글 삭제(작성자 본인). 댓글은 기사와 달리 하드 삭제 허용. */
export async function deleteComment({
  commentId,
}: DeleteCommentParams): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
