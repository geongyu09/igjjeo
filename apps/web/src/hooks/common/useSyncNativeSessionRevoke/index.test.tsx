import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, request } = vi.hoisted(() => ({
  state: { isNativeShell: true },
  request: vi.fn(),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

// useBridge 의 request 는 렌더마다 새 함수 identity 를 갖는다(라이브러리가 memoize 하지 않음).
// 실제 동작을 재현하려고 렌더마다 안정 스파이를 감싼 새 함수를 반환한다.
vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({
    request: (args: unknown) => (request as (a: unknown) => unknown)(args),
  }),
}));

import { tokenStore } from "@/lib/api/tokenStore";
import { useSyncNativeSessionRevoke } from ".";

describe("useSyncNativeSessionRevoke", () => {
  beforeEach(() => {
    state.isNativeShell = true;
    request.mockReset();
    localStorage.clear();
    tokenStore.reset();
  });

  it("세션이 폐기되면 네이티브에 clearSession 을 보낸다", () => {
    const { rerender } = renderHook(() => useSyncNativeSessionRevoke());
    expect(request).not.toHaveBeenCalled();

    act(() => {
      tokenStore.revoke();
    });
    rerender();

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toMatchObject({
      requestMessage: { type: "clearSession" },
    });
  });

  // 응답이 필요 없는 메시지에 콜백을 넘기면 RWindow(최대 20) 를 채운다(geongyu-bridge 주의사항 9번).
  it("응답 콜백 없이 보낸다", () => {
    renderHook(() => useSyncNativeSessionRevoke());

    act(() => {
      tokenStore.revoke();
    });

    expect(request.mock.calls[0][0]).not.toHaveProperty("responseCallback");
  });

  it("리렌더가 반복돼도 한 번만 보낸다", () => {
    const { rerender } = renderHook(() => useSyncNativeSessionRevoke());

    act(() => {
      tokenStore.revoke();
    });
    for (let i = 0; i < 5; i += 1) rerender();

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("네이티브 셸이 아니면 보내지 않는다", () => {
    state.isNativeShell = false;
    renderHook(() => useSyncNativeSessionRevoke());

    act(() => {
      tokenStore.revoke();
    });

    expect(request).not.toHaveBeenCalled();
  });

  it("폐기되지 않은 상태에서는 보내지 않는다", () => {
    renderHook(() => useSyncNativeSessionRevoke());

    act(() => {
      tokenStore.set({ access_token: "a", refresh_token: "r" });
    });

    expect(request).not.toHaveBeenCalled();
  });

  it("재로그인 후 다시 폐기되면 또 보낸다", () => {
    renderHook(() => useSyncNativeSessionRevoke());

    act(() => {
      tokenStore.revoke();
    });
    act(() => {
      tokenStore.set({ access_token: "a", refresh_token: "r" });
    });
    act(() => {
      tokenStore.revoke();
    });

    expect(request).toHaveBeenCalledTimes(2);
  });
});
