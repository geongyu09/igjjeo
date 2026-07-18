import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeGroupStore } from "@/lib/session/activeGroupStore";
import { useActiveGroupId } from ".";

describe("useActiveGroupId", () => {
  beforeEach(() => {
    localStorage.clear();
    activeGroupStore.clear();
  });
  afterEach(() => {
    localStorage.clear();
    activeGroupStore.clear();
  });

  it("초기에는 null을 반환한다", () => {
    const { result } = renderHook(() => useActiveGroupId());
    expect(result.current).toBeNull();
  });

  it("저장된 활성 방 id를 반환한다", () => {
    activeGroupStore.set("g1");
    const { result } = renderHook(() => useActiveGroupId());
    expect(result.current).toBe("g1");
  });

  it("활성 방이 바뀌면 다시 렌더된다", () => {
    const { result } = renderHook(() => useActiveGroupId());
    expect(result.current).toBeNull();

    act(() => activeGroupStore.set("g2"));
    expect(result.current).toBe("g2");
  });
});
