import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, request, set } = vi.hoisted(() => ({
  state: { isNativeShell: true },
  request: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request }),
}));

vi.mock("@/lib/api/tokenStore", () => ({
  tokenStore: { set },
}));

import { useRestoreNativeSession } from ".";

describe("useRestoreNativeSession", () => {
  beforeEach(() => {
    state.isNativeShell = true;
    request.mockReset();
    set.mockReset();
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

  it("enabled 가 false 면(이미 세션 있음) 요청하지 않는다", () => {
    renderHook(() => useRestoreNativeSession({ enabled: false }));
    expect(request).not.toHaveBeenCalled();
  });
});
