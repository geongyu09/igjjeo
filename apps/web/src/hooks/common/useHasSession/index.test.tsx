import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { tokenStore } from "@/lib/api/tokenStore";
import { useHasSession } from ".";

describe("useHasSession", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.clear();
  });
  afterEach(() => {
    localStorage.clear();
    tokenStore.clear();
  });

  it("액세스 토큰이 없으면 false", () => {
    const { result } = renderHook(() => useHasSession());
    expect(result.current).toBe(false);
  });

  it("토큰이 저장되면 true로 반응한다", () => {
    const { result } = renderHook(() => useHasSession());

    act(() => {
      tokenStore.set({ access_token: "a", refresh_token: "r" });
    });
    expect(result.current).toBe(true);
  });

  it("토큰이 비워지면 false로 반응한다", () => {
    tokenStore.set({ access_token: "a", refresh_token: "r" });
    const { result } = renderHook(() => useHasSession());
    expect(result.current).toBe(true);

    act(() => {
      tokenStore.clear();
    });
    expect(result.current).toBe(false);
  });
});
