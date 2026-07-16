/**
 * 반응 도메인 상수 — reaction_type은 DB(reactions.reaction_type)와 공유하는 식별자.
 * 원본 정의: .claude/skills/igjjeo-spec/references/data-model.md
 */

export const REACTION_TYPES = ["really", "shock", "admit", "scoop"] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_LABELS: Record<ReactionType, string> = {
  really: "진짜?",
  shock: "충격",
  admit: "인정",
  scoop: "특종",
};
