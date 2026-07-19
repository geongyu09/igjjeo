/**
 * 프로토타입 언론사 5종 (ai-rules.md — 제보자가 최소 1곳 직접 선택).
 * economy(스터디경제)는 잠시 내렸다 — 되살릴 때 아래 주석 두 줄을 함께 푼다.
 */
export type OutletKey =
  | "daily"
  | "shock"
  // | "economy"
  | "science"
  | "emotion"
  | "praise";

export const OUTLET_KEYS: OutletKey[] = [
  "daily",
  "shock",
  // "economy",
  "science",
  "emotion",
  "praise",
];

/** 제보 한 건에 고를 수 있는 언론사 최대 개수. 웹(publishers.ts)과 같은 값을 유지한다. */
export const MAX_OUTLET_SELECTION = 3;

/** 각색된 기사 초안(발행 전, articles 로 승격되기 전 형태). */
export interface DraftArticle {
  outlet_key: OutletKey;
  headline: string;
  body: string;
  reporter_name: string;
}

/** 각색 어댑터 입력. 프롬프트에는 maskedName 만 넣는다. */
export interface AdaptationInput {
  rawText: string;
  outletKeys: OutletKey[];
  subjects: { rawName: string; maskedName: string }[];
  isSelfReport: boolean;
  /** 정정 각색일 때 "본지는 앞선 보도를 정정합니다" 프리앰블을 요구한다. */
  isCorrection?: boolean;
}

/** 각색 거부 사유. 엔드포인트가 422 adaptation_refused 로 변환한다. */
export type RefusalReason = "appearance_or_ability" | "harassment" | "other";

export type AdaptationResult =
  | { status: "ok"; articles: DraftArticle[] }
  | { status: "refused"; reason: RefusalReason; message: string };

/** AI 각색 어댑터 계약(서버 내부 단일 봉합선). 구현은 ModelAdaptationAdapter 한 곳. */
export interface AdaptationPort {
  adaptReport(input: AdaptationInput): Promise<AdaptationResult>;
}

/** DI 토큰 — 서비스는 이 토큰으로 어댑터를 주입받는다(구현 교체 봉합선). */
export const ADAPTATION_PORT = Symbol("ADAPTATION_PORT");
