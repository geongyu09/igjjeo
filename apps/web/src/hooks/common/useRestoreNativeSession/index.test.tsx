import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, request, set, isRevoked } = vi.hoisted(() => ({
  state: { isNativeShell: true },
  request: vi.fn(),
  set: vi.fn(),
  isRevoked: vi.fn(() => false),
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

vi.mock("@/lib/api/tokenStore", () => ({
  tokenStore: { set, isRevoked },
}));

import { useRestoreNativeSession } from ".";

describe("useRestoreNativeSession", () => {
  beforeEach(() => {
    state.isNativeShell = true;
    request.mockReset();
    set.mockReset();
    isRevoked.mockReset();
    isRevoked.mockReturnValue(false);
  });

  it("네이티브 셸이면 getSession 을 요청하고 받은 세션을 tokenStore 에 저장한다", () => {
    const session = { access_token: "a", refresh_token: "r" };
    request.mockImplementation(
      (args: {
        requestMessage: unknown;
        responseCallback?: (res: unknown) => void;
      }) => {
        expect(args.requestMessage).toEqual({ type: "getSession" });
        args.responseCallback?.({ success: true, session });
      },
    );

    renderHook(() => useRestoreNativeSession({ enabled: true }));

    expect(set).toHaveBeenCalledWith(session);
  });

  it("네이티브 셸이 아니면 요청하지 않고 unavailable 을 반환한다", () => {
    state.isNativeShell = false;

    const { result } = renderHook(() =>
      useRestoreNativeSession({ enabled: true }),
    );

    expect(request).not.toHaveBeenCalled();
    expect(result.current).toBe("unavailable");
  });

  it("네이티브에 세션이 없으면 unavailable 을 반환한다", () => {
    request.mockImplementation(
      (args: { responseCallback?: (res: unknown) => void }) => {
        args.responseCallback?.({ success: true, session: null });
      },
    );

    const { result } = renderHook(() =>
      useRestoreNativeSession({ enabled: true }),
    );

    expect(set).not.toHaveBeenCalled();
    expect(result.current).toBe("unavailable");
  });

  // 세션이 401 로 폐기된 직후에 복원을 걸면, 네이티브가 아직 비우지 못한 같은 죽은 토큰을
  // 되받아 401 → 폐기 → 복원 루프에 빠진다("세션 확인 중" 무한 로딩).
  it("세션이 폐기된 상태면 복원을 시도하지 않고 unavailable 을 반환한다", () => {
    isRevoked.mockReturnValue(true);

    const { result } = renderHook(() =>
      useRestoreNativeSession({ enabled: true }),
    );

    expect(request).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(result.current).toBe("unavailable");
  });

  it("enabled 가 false 면(이미 세션 있음) 요청하지 않는다", () => {
    renderHook(() => useRestoreNativeSession({ enabled: false }));
    expect(request).not.toHaveBeenCalled();
  });

  it("응답이 없어도 리렌더에 카운터가 리셋되지 않고 재시도 한도 후 unavailable 로 종료한다", () => {
    // 핸드셰이크 전 유실 등으로 응답이 오지 않는 상황: responseCallback 을 호출하지 않는다.
    request.mockImplementation(() => {});

    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(() =>
        useRestoreNativeSession({ enabled: true }),
      );

      // 매 재시도(300ms) 사이에 리렌더(핸드셰이크 완료로 request 재생성 등)가 끼어들어도
      // 재시도 카운터가 초기화되지 않아야 MAX_ATTEMPTS 안전장치가 동작한다.
      for (let i = 0; i < 12; i += 1) {
        act(() => {
          vi.advanceTimersByTime(300);
        });
        rerender();
      }

      expect(result.current).toBe("unavailable");
    } finally {
      vi.useRealTimers();
    }
  });
});
