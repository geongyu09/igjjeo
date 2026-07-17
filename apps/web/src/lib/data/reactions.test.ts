import { beforeEach, describe, expect, it, vi } from "vitest";

const put = vi.fn();
const del = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    put: (...a: unknown[]) => put(...a),
    delete: (...a: unknown[]) => del(...a),
  },
}));

import { addReaction, removeReaction } from "./reactions";

beforeEach(() => {
  put.mockReset();
  del.mockReset();
});

describe("reactions 데이터 계층", () => {
  it("addReaction은 PUT /articles/{id}/reactions/{type}로 갱신 집계를 받는다", async () => {
    put.mockResolvedValue({
      data: { article_id: "a1", reaction_counts: {}, my_reactions: ["admit"] },
    });
    const result = await addReaction({
      articleId: "a1",
      reactionType: "admit",
    });

    expect(put).toHaveBeenCalledWith("/articles/a1/reactions/admit");
    expect(result.my_reactions).toEqual(["admit"]);
  });

  it("removeReaction은 DELETE 토글 경로를 호출한다", async () => {
    del.mockResolvedValue({
      data: { article_id: "a1", reaction_counts: {}, my_reactions: [] },
    });
    await removeReaction({ articleId: "a1", reactionType: "scoop" });

    expect(del).toHaveBeenCalledWith("/articles/a1/reactions/scoop");
  });
});
