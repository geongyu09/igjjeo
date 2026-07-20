import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigate, request, state } = vi.hoisted(() => ({
  navigate: vi.fn(),
  request: vi.fn(),
  state: { isNativeShell: false },
}));

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate, isNavigating: false }),
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

import { useFinishOnboarding } from ".";

describe("useFinishOnboarding", () => {
  beforeEach(() => {
    navigate.mockClear();
    request.mockClear();
    state.isNativeShell = false;
  });

  it("브라우저(네이티브 셸 아님)에서는 stack-link로 방 허브(/group)로 이동한다", () => {
    const { result } = renderHook(() => useFinishOnboarding());
    result.current();

    expect(navigate).toHaveBeenCalledWith({
      href: "/group",
      animation: "slide",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("네이티브 셸 안에서는 bridge로 finishOnboarding을 요청한다", () => {
    state.isNativeShell = true;

    const { result } = renderHook(() => useFinishOnboarding());
    result.current();

    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "finishOnboarding" },
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
