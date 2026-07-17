/**
 * 정정·삭제 데이터 접근 계층 (corrections-deletion.md).
 * 삭제 요청은 이유 불요 · 즉시 소프트 다운(is_active=false), 원 기사 하드 삭제는 없다.
 * 정정 요청은 is_subject로 당사자/제3자를 나눠 응답 형태가 갈린다.
 */

import { apiClient } from "@/lib/api/client";
import type {
  Article,
  CorrectionResult,
  DeletionResult,
} from "@/lib/api/types";
import { idempotencyHeaders } from "./idempotency";

export interface ArticleIdParams {
  articleId: string;
}

/** 당사자의 기사 삭제 요청 — 이유 불요, 즉시 is_active=false. */
export async function requestDeletion({
  articleId,
  idempotencyKey,
}: ArticleIdParams & { idempotencyKey?: string }): Promise<DeletionResult> {
  const { data } = await apiClient.post<DeletionResult>(
    `/articles/${articleId}/deletion-request`,
    undefined,
    { headers: idempotencyHeaders(idempotencyKey) },
  );
  return data;
}

export interface RequestCorrectionParams {
  articleId: string;
  /** true=당사자 정정(반박, 정정 기사 1건) / false=제3자 정정(새 사건, 언론사 수만큼) */
  isSubject: boolean;
  correctionText: string;
  /** 각색 중복 방지 — 멱등 키 필수 */
  idempotencyKey?: string;
}

/**
 * 정정 요청. 응답은 is_subject에 따라 갈린다:
 * - 당사자(true): `SubjectCorrectionResult`(article 1건)
 * - 제3자(false): `ThirdPartyCorrectionResult`(report_id + articles[])
 */
export async function requestCorrection({
  articleId,
  isSubject,
  correctionText,
  idempotencyKey,
}: RequestCorrectionParams): Promise<CorrectionResult> {
  const { data } = await apiClient.post<CorrectionResult>(
    `/articles/${articleId}/correction-requests`,
    { is_subject: isSubject, correction_text: correctionText },
    { headers: idempotencyHeaders(idempotencyKey) },
  );
  return data;
}

/** 특정 기사의 정정 연쇄/관련 기사 목록(선택 — 상세의 correction_chain으로 대개 충분). */
export async function getCorrections({
  articleId,
}: ArticleIdParams): Promise<{ items: Article[] }> {
  const { data } = await apiClient.get<{ items: Article[] }>(
    `/articles/${articleId}/corrections`,
  );
  return data;
}
