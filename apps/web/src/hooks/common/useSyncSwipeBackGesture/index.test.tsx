import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { request, state } = vi.hoisted(() => ({
  request: vi.fn(),
  state: { canGoBack: false, isNativeShell: true },
}));

vi.mock("stack-link", () => ({
  useStackLinkBack: () => ({ goBack: vi.fn(), canGoBack: state.canGoBack }),
}));

// useBridge 의 request 는 렌더마다 새 함수 identity 를 갖는다(라이브러리가 memoize 하지 않음).
// 실제 동작을 재현하려고 렌더마다 안정 스파이를 감싼 새 함수를 반환한다.
vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({
    request: (args: unknown) => (request as (a: unknown) => unknown)(args),
  }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

import { useSyncSwipeBackGesture } from "./index";

describe("useSyncSwipeBackGesture", () => {
  it("네이티브 셸에서 웹 스택이 비면(canGoBack=false) 스와이프 백을 활성화(enabled:true)한다", () => {
    request.mockClear();
    state.canGoBack = false;
    state.isNativeShell = true;
    renderHook(() => useSyncSwipeBackGesture());
    expect(request).toHaveBeenCalledWith({
      requestMessage: {
        type: "setSwipeBackEnabled",
        payload: { enabled: true },
      },
    });
  });

  it("웹 스택이 남아 있으면(canGoBack=true) 스와이프 백을 비활성화(enabled:false)한다", () => {
    request.mockClear();
    state.canGoBack = true;
    state.isNativeShell = true;
    renderHook(() => useSyncSwipeBackGesture());
    expect(request).toHaveBeenCalledWith({
      requestMessage: {
        type: "setSwipeBackEnabled",
        payload: { enabled: false },
      },
    });
  });

  it("브라우저(비네이티브)에서는 아무 것도 전송하지 않는다", () => {
    request.mockClear();
    state.isNativeShell = false;
    renderHook(() => useSyncSwipeBackGesture());
    expect(request).not.toHaveBeenCalled();
  });

  it("canGoBack 이 그대로면 리렌더에도 재전송하지 않는다", () => {
    request.mockClear();
    state.canGoBack = false;
    state.isNativeShell = true;
    const { rerender } = renderHook(() => useSyncSwipeBackGesture());
    rerender();
    rerender();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
