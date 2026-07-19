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

import { useCloseReportModal } from "./index";

describe("useCloseReportModal", () => {
  it("네이티브 셸 안에서는 bridge로 closeReportModal을 요청한다", () => {
    navigate.mockClear();
    request.mockClear();
    state.isNativeShell = true;

    const { result } = renderHook(() => useCloseReportModal());
    result.current();

    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "closeReportModal" },
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("브라우저(네이티브 셸 아님)에서는 닫을 모달이 없으므로 stack-link로 피드로 이동한다", () => {
    navigate.mockClear();
    request.mockClear();
    state.isNativeShell = false;

    const { result } = renderHook(() => useCloseReportModal());
    result.current();

    expect(navigate).toHaveBeenCalledWith({ href: "/", animation: "none" });
    expect(request).not.toHaveBeenCalled();
  });
});
