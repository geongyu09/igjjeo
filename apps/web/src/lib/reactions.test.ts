import { describe, expect, it } from "vitest";
import { REACTION_TYPES } from "./reactions";

describe("reactions", () => {
  it("반응 4종을 reactions.reaction_type과 같은 순서·이름으로 정의한다", () => {
    expect(REACTION_TYPES).toEqual(["really", "shock", "admit", "scoop"]);
  });
});
