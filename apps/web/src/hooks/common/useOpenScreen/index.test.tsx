import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { useOpenScreen } from "./index";

describe("useOpenScreen", () => {
  it("브라우저(네이티브 셸 아님)에서는 stack-link로 슬라이드 전환한다", () => {
    navigate.mockClear();
    request.mockClear();
    state.isNativeShell = false;

    const { result } = renderHook(() => useOpenScreen());
    result.current("/article/1");

    expect(navigate).toHaveBeenCalledWith({
      href: "/article/1",
      animation: "slide",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("네이티브 셸 안에서는 bridge로 pushScreen을 요청한다", () => {
    navigate.mockClear();
    request.mockClear();
    state.isNativeShell = true;

    const { result } = renderHook(() => useOpenScreen());
    result.current("/article/1");

    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "pushScreen", payload: { url: "/article/1" } },
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
