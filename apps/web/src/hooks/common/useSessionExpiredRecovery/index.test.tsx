import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheClear, tokenRevoke, activeClear } = vi.hoisted(() => ({
  cacheClear: vi.fn(),
  tokenRevoke: vi.fn(),
  activeClear: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: cacheClear }),
}));

vi.mock("@/lib/api/tokenStore", () => ({
  tokenStore: { revoke: tokenRevoke },
}));

vi.mock("@/lib/session/activeGroupStore", () => ({
  activeGroupStore: { clear: activeClear },
}));

import { useSessionExpiredRecovery } from ".";

describe("useSessionExpiredRecovery", () => {
  beforeEach(() => {
    cacheClear.mockClear();
    tokenRevoke.mockClear();
    activeClear.mockClear();
  });

  it("마운트만으로는 세션을 비우지 않는다", () => {
    renderHook(() => useSessionExpiredRecovery());
    expect(tokenRevoke).not.toHaveBeenCalled();
    expect(activeClear).not.toHaveBeenCalled();
    expect(cacheClear).not.toHaveBeenCalled();
  });

  it("반환한 함수를 호출하면 로컬 세션·활성 방·쿼리 캐시를 비운다", () => {
    const { result } = renderHook(() => useSessionExpiredRecovery());
    result.current();
    expect(tokenRevoke).toHaveBeenCalledTimes(1);
    expect(activeClear).toHaveBeenCalledTimes(1);
    expect(cacheClear).toHaveBeenCalledTimes(1);
  });

  // clear가 아니라 revoke — 폐기 표시가 있어야 네이티브 세션까지 지워지고
  // (useSyncNativeSessionRevoke) 게이트가 같은 죽은 토큰을 다시 복원하지 않는다.
  it("clear가 아니라 revoke로 폐기해 네이티브 전파·복원 차단이 걸리게 한다", () => {
    const { result } = renderHook(() => useSessionExpiredRecovery());
    result.current();
    expect(tokenRevoke).toHaveBeenCalledTimes(1);
  });
});
