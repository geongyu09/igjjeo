import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { invalidateQueries } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

import { useNativeFocusRefetch } from "./index";

describe("useNativeFocusRefetch", () => {
  it("네이티브 focus 복귀 시 모든 쿼리를 무효화해 활성 쿼리를 refetch하고 consumed:true를 응답한다", () => {
    invalidateQueries.mockClear();
    const { result } = renderHook(() => useNativeFocusRefetch());

    const res = result.current();

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ consumed: true });
  });
});
