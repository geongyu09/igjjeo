/**
 * 언론사 도메인 상수 — outlet_key는 DB(articles.outlet_key)와 공유하는 식별자.
 * 원본 정의: .claude/skills/igjjeo-spec/references/ai-rules.md
 */

/** economy(스터디경제)는 5종 체제에서 잠시 내렸다 — 되살릴 때 아래 주석들을 함께 푼다. */
export const OUTLET_KEYS = [
  "daily",
  "shock",
  // "economy",
  "science",
  "emotion",
  "praise",
] as const;

export type OutletKey = (typeof OUTLET_KEYS)[number];

/**
 * 제보 한 건에 고를 수 있는 언론사 최대 개수.
 * 서버(apps/server의 adaptation.types.ts MAX_OUTLET_SELECTION)와 같은 값을 유지한다.
 */
export const MAX_OUTLET_SELECTION = 3;

export interface Publisher {
  key: OutletKey;
  name: string;
  /** 언론사의 성격 한 줄 */
  tagline: string;
  /** MVP 범위 포함 여부 — 현재 5종 체제에서는 정의된 언론사 전부가 선택 대상 */
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
  // economy: {
  //   key: "economy",
  //   name: "스터디경제",
  //   tagline: "숫자와 통계로 분석합니다.",
  //   mvp: true,
  // },
  science: {
    key: "science",
    name: "모임과학",
    tagline: "원인을 학술적으로 규명합니다.",
    mvp: true,
  },
  emotion: {
    key: "emotion",
    name: "주간감성",
    tagline: "감성 에세이처럼 씁니다.",
    mvp: true,
  },
  praise: {
    key: "praise",
    name: "일간찬양",
    tagline: "오글거릴 만큼 극찬만 합니다.",
    mvp: true,
  },
};

export const MVP_OUTLETS: OutletKey[] = OUTLET_KEYS.filter(
  (key) => PUBLISHERS[key].mvp,
);
