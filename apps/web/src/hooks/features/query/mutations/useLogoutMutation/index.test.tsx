import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, activeClear, logout, state } = vi.hoisted(() => ({
  request: vi.fn(),
  activeClear: vi.fn(),
  logout: vi.fn(),
  state: { isNativeShell: false },
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

vi.mock("@/lib/data/auth", () => ({ logout }));

vi.mock("@/lib/session/activeGroupStore", () => ({
  activeGroupStore: { clear: activeClear },
}));

import { useLogoutMutation } from ".";

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const cacheClear = vi.spyOn(queryClient, "clear");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...renderHook(() => useLogoutMutation(), { wrapper }), cacheClear };
}

describe("useLogoutMutation", () => {
  beforeEach(() => {
    request.mockClear();
    activeClear.mockClear();
    logout.mockReset().mockResolvedValue(undefined);
    state.isNativeShell = false;
  });

  it("로그아웃 성공 시 서버 상태 캐시와 활성 방을 비운다", async () => {
    const { result, cacheClear } = setup();
    result.current.mutate();
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(cacheClear).toHaveBeenCalledTimes(1);
    expect(activeClear).toHaveBeenCalledTimes(1);
  });

  it("네이티브 셸이면 로그아웃 성공 시 clearSession으로 로그인 스크린으로 되돌린다", async () => {
    state.isNativeShell = true;
    const { result } = setup();
    result.current.mutate();
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        requestMessage: { type: "clearSession" },
      }),
    );
  });

  it("서버 로그아웃이 실패해도 로컬 토큰은 이미 비워지므로 로그인 스크린으로 되돌린다", async () => {
    state.isNativeShell = true;
    logout.mockRejectedValue(new Error("401"));
    const { result, cacheClear } = setup();
    result.current.mutate();
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(cacheClear).toHaveBeenCalledTimes(1);
    expect(activeClear).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "clearSession" },
    });
  });

  it("브라우저(네이티브 셸 아님)면 clearSession을 요청하지 않는다", async () => {
    const { result } = setup();
    result.current.mutate();
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(request).not.toHaveBeenCalled();
  });
});
