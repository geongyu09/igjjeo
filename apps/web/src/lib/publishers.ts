/**
 * 언론사 도메인 상수 — outlet_key는 DB(articles.outlet_key)와 공유하는 식별자.
 * 원본 정의: .claude/skills/igjjeo-spec/references/ai-rules.md
 */

export const OUTLET_KEYS = [
  "daily",
  "shock",
  "economy",
  "science",
  "emotion",
] as const;

export type OutletKey = (typeof OUTLET_KEYS)[number];

export interface Publisher {
  key: OutletKey;
  name: string;
  /** 언론사의 성격 한 줄 */
  tagline: string;
  /** MVP 범위 포함 여부 — science·emotion은 v2 확장 */
  mvp: boolean;
}

export const PUBLISHERS: Record<OutletKey, Publisher> = {
  daily: {
    key: "daily",
    name: "소모임일보",
    tagline: "사실만 담담하게 전달합니다.",
    mvp: true,
  },
  shock: {
    key: "shock",
    name: "데일리쇼크",
    tagline: "최대한 자극적으로 과장합니다.",
    mvp: true,
  },
  economy: {
    key: "economy",
    name: "스터디경제",
    tagline: "숫자와 통계로 분석합니다.",
    mvp: true,
  },
  science: {
    key: "science",
    name: "모임과학",
    tagline: "학술적으로 원인을 규명합니다.",
    mvp: false,
  },
  emotion: {
    key: "emotion",
    name: "주간감성",
    tagline: "감성 에세이처럼 씁니다.",
    mvp: false,
  },
};

export const MVP_OUTLETS: OutletKey[] = OUTLET_KEYS.filter(
  (key) => PUBLISHERS[key].mvp,
);
