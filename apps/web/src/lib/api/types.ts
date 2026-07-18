/**
 * 백엔드 HTTP API(`/v1`)의 리소스·응답 타입.
 *
 * 필드는 서버 응답의 wire 포맷(snake_case)을 그대로 따른다 — 변환 계층을 두지 않고
 * 데이터 접근 계층이 이 타입으로 파싱된 JSON을 그대로 돌려준다.
 * 계약 원본: `.claude/skills/igjjeo-backend-api/*`.
 */

import type { OutletKey } from "@/lib/publishers";
import type { ReactionType } from "@/lib/reactions";

/** 제보 상태 (conventions.md §9) */
export type ReportStatus = "draft" | "published";

/** 방 멤버 역할 (conventions.md §9) */
export type MemberRole = "owner" | "member";

/** 커서 페이지네이션 봉투 (conventions.md §4·§6) */
export interface Paginated<T> {
  items: T[];
  next_cursor: string | null;
  has_more?: boolean;
}

/** 커서 목록 조회 공통 쿼리 파라미터 (conventions.md §6) */
export interface PageParams {
  limit?: number;
  cursor?: string;
}

// ── 1. 인증·프로필 ──────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  masked_name: string;
  avatar_url: string | null;
  /** 온보딩(이름 등 기본 정보 입력) 완료 여부. 소셜 신규 가입만 false 로 시작한다. */
  onboarded: boolean;
  /** 구독 중인 언론사 키 목록(프로필에 공개되는 취향). */
  subscribed_outlets: OutletKey[];
  created_at: string;
}

/** 프로필 화면(07)의 방-스코프 요약: 통계 + 내가 낸 제보 목록. */
export interface MemberProfileSummary {
  stats: { reports: number; reactions: number; scoops: number };
  reports: MemberReport[];
}

/** 프로필에 노출되는 내 제보 한 건(대표 기사 기준). */
export interface MemberReport {
  id: string;
  outlet_key: OutletKey;
  headline: string;
  reaction_count: number;
}

export interface TokenBundle {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/** signup·login 응답: 프로필 + 토큰 번들 */
export interface AuthResult extends TokenBundle {
  profile: Profile;
}

// ── 2. 방·멤버십 ────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  role: MemberRole;
  member_count: number;
  created_at: string;
}

export interface Member {
  user_id: string;
  display_name: string;
  masked_name: string;
  role: MemberRole;
  joined_at: string;
}

// ── 3. 제보·각색·발행 ───────────────────────────────────────────

export interface Upload {
  url: string;
  content_type: string;
  bytes: number;
}

export interface Report {
  id: string;
  status: ReportStatus;
  created_at: string;
}

/** 발행 전 각색 초안(아직 `articles`에 미저장) */
export interface DraftArticle {
  outlet_key: OutletKey;
  headline: string;
  body: string;
  reporter_name: string;
}

/** POST reports·regenerate·GET report 공통 응답 */
export interface ReportDraft {
  report: Report;
  draft_articles: DraftArticle[];
}

// ── 4. 피드·기사 ────────────────────────────────────────────────

export type ReactionCounts = Record<ReactionType, number>;

/** 피드 카드용 기사 요약 */
export interface FeedArticle {
  id: string;
  outlet_key: OutletKey;
  headline: string;
  excerpt: string;
  reporter_name: string;
  published_at: string;
  is_correction: boolean;
  reaction_counts: ReactionCounts;
  comment_count: number;
  my_reactions: ReactionType[];
}

/** 제보(report_id) 단위로 묶인 피드 항목 */
export interface FeedBundle {
  report_id: string;
  reporter: { masked_name: string };
  articles: FeedArticle[];
}

/** 정정 연쇄의 관련 기사 요약 */
export interface CorrectionChainItem {
  id: string;
  is_correction: boolean;
  headline: string;
}

/** 기사 상세 */
export interface Article {
  id: string;
  report_id: string;
  group_id: string;
  outlet_key: OutletKey;
  headline: string;
  body: string;
  reporter_name: string;
  reporter: { masked_name: string };
  published_at: string;
  is_correction: boolean;
  corrects_article_id: string | null;
  is_active: boolean;
  reaction_counts: ReactionCounts;
  my_reactions: ReactionType[];
  comment_count: number;
  correction_chain: CorrectionChainItem[];
}

// ── 5. 반응·댓글 ────────────────────────────────────────────────

/** 반응 토글 후 갱신된 집계 */
export interface ReactionState {
  article_id: string;
  reaction_counts: ReactionCounts;
  my_reactions: ReactionType[];
}

export interface Comment {
  id: string;
  author: { masked_name: string };
  body: string;
  created_at: string;
}

// ── 6. 정정·삭제 ────────────────────────────────────────────────

export interface DeletionResult {
  article_id: string;
  is_active: false;
}

/** 당사자 정정(is_subject=true) 응답 */
export interface SubjectCorrectionResult {
  correction_request_id: string;
  article: Article;
}

/** 제3자 정정(is_subject=false) 응답 */
export interface ThirdPartyCorrectionResult {
  correction_request_id: string;
  report_id: string;
  articles: Article[];
}

export type CorrectionResult =
  SubjectCorrectionResult | ThirdPartyCorrectionResult;

// ── 7. 데일리 프롬프트 ──────────────────────────────────────────

export interface DailyPrompt {
  id: string;
  question: string;
  date: string;
  answer_count: number;
  answered_by_me: boolean;
}

export interface DailyPromptAnswerResult {
  prompt_id: string;
  answer_count: number;
  answered_by_me: boolean;
}

/** 데일리 프롬프트 발행·제3자 정정 등 "제보→기사들" 결과 */
export interface PublishResult {
  report_id: string;
  articles: Article[];
}
