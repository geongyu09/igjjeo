import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, cacheClear, tokenClear, activeClear, state } = vi.hoisted(
  () => ({
    request: vi.fn(),
    cacheClear: vi.fn(),
    tokenClear: vi.fn(),
    activeClear: vi.fn(),
    state: { isNativeShell: false },
  }),
);

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: cacheClear }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

vi.mock("@/lib/api/tokenStore", () => ({
  tokenStore: { clear: tokenClear },
}));

vi.mock("@/lib/session/activeGroupStore", () => ({
  activeGroupStore: { clear: activeClear },
}));

import { useSessionExpiredRecovery } from ".";

describe("useSessionExpiredRecovery", () => {
  beforeEach(() => {
    request.mockClear();
    cacheClear.mockClear();
    tokenClear.mockClear();
    activeClear.mockClear();
    state.isNativeShell = false;
  });

  it("마운트만으로는 세션을 비우지 않는다", () => {
    renderHook(() => useSessionExpiredRecovery());
    expect(tokenClear).not.toHaveBeenCalled();
    expect(activeClear).not.toHaveBeenCalled();
    expect(cacheClear).not.toHaveBeenCalled();
  });

  it("반환한 함수를 호출하면 로컬 세션·활성 방·쿼리 캐시를 비운다", () => {
    const { result } = renderHook(() => useSessionExpiredRecovery());
    result.current();
    expect(tokenClear).toHaveBeenCalledTimes(1);
    expect(activeClear).toHaveBeenCalledTimes(1);
    expect(cacheClear).toHaveBeenCalledTimes(1);
  });

  it("네이티브 셸이면 호출 시 브리지로 clearSession을 요청해 로그인 스크린으로 되돌린다", () => {
    state.isNativeShell = true;
    const { result } = renderHook(() => useSessionExpiredRecovery());
    result.current();
    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "clearSession" },
    });
  });

  it("브라우저(네이티브 셸 아님)면 clearSession을 요청하지 않는다", () => {
    const { result } = renderHook(() => useSessionExpiredRecovery());
    result.current();
    expect(request).not.toHaveBeenCalled();
  });
});
