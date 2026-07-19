/**
 * 제보·각색·발행 데이터 접근 계층 (reports-adaptation.md) — 핵심 쓰기 파이프라인.
 * 발행 본문은 서버가 캐시한 초안이 유일한 진실이므로, 발행 요청은 outlet_key 목록만 보낸다.
 */

import { apiClient } from "@/lib/api/client";
import type { Article, ReportDraft, ReportQuota } from "@/lib/api/types";
import type { OutletKey } from "@/lib/publishers";
import { idempotencyHeaders } from "./idempotency";

export interface CreateReportParams {
  groupId: string;
  rawText: string;
  photoUrl?: string;
  /** 대상 언론사(미지정 시 서버 기본 MVP 3종) */
  outletKeys?: OutletKey[];
  isSelfReport?: boolean;
  /** 각색 중복 과금 방지용 멱등 키(권장) */
  idempotencyKey?: string;
}

/** 제보 생성 + 각색 실행 → 발행 확인용 초안 반환. */
export async function createReport({
  groupId,
  rawText,
  photoUrl,
  outletKeys,
  isSelfReport,
  idempotencyKey,
}: CreateReportParams): Promise<ReportDraft> {
  const { data } = await apiClient.post<ReportDraft>(
    `/groups/${groupId}/reports`,
    {
      raw_text: rawText,
      photo_url: photoUrl,
      outlet_keys: outletKeys,
      is_self_report: isSelfReport,
    },
    { headers: idempotencyHeaders(idempotencyKey) },
  );
  return data;
}

export interface PublishReportParams {
  reportId: string;
  /** 캐시 초안 중 발행할 언론사(부분집합 = 일부 제외) */
  outletKeys: OutletKey[];
  /** 중복 발행 방지 — 멱등 키 필수 */
  idempotencyKey?: string;
}

/** 확인한 초안 중 선택분을 실제 기사로 발행. */
export async function publishReport({
  reportId,
  outletKeys,
  idempotencyKey,
}: PublishReportParams): Promise<{ articles: Article[] }> {
  const { data } = await apiClient.post<{ articles: Article[] }>(
    `/reports/${reportId}/publish`,
    { outlet_keys: outletKeys },
    { headers: idempotencyHeaders(idempotencyKey) },
  );
  return data;
}

export interface ReportIdParams {
  reportId: string;
}

/** 미발행 제보의 현재 초안 재조회(발행 확인 화면 새로고침 대비). */
export async function getReportDraft({
  reportId,
}: ReportIdParams): Promise<ReportDraft> {
  const { data } = await apiClient.get<ReportDraft>(`/reports/${reportId}`);
  return data;
}

/** 오늘 제보 한도 사용 현황 조회 (GET /me/report-quota). */
export async function getReportQuota(): Promise<ReportQuota> {
  const { data } = await apiClient.get<ReportQuota>("/me/report-quota");
  return data;
}

/**
 * 오늘 제보 한도 충전 (POST /me/report-quota/refill).
 * 지금은 누르면 즉시 한도가 전량 회복된다(이후 광고 시청 보상으로 대체 예정).
 */
export async function refillReportQuota(): Promise<ReportQuota> {
  const { data } = await apiClient.post<ReportQuota>("/me/report-quota/refill");
  return data;
}
