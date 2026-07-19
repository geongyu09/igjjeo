import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { refetchQueries } = vi.hoisted(() => ({
  refetchQueries: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ refetchQueries }),
}));

import { queryKeys } from "@/hooks/features/query/keys";
import { useRefreshFeed } from "./index";

describe("useRefreshFeed", () => {
  it("해당 방의 피드 쿼리만 다시 가져온다", async () => {
    refetchQueries.mockClear();
    const { result } = renderHook(() => useRefreshFeed({ groupId: "g1" }));

    await result.current();

    expect(refetchQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.feed("g1"),
    });
  });
});
