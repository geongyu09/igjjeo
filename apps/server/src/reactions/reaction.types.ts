/** 반응 4종 (conventions.md §9): 진짜?/충격/인정/특종. */
export type ReactionType = "really" | "shock" | "admit" | "scoop";

export const REACTION_TYPES: ReactionType[] = [
  "really",
  "shock",
  "admit",
  "scoop",
];

export function isReactionType(value: string): value is ReactionType {
  return (REACTION_TYPES as string[]).includes(value);
}
