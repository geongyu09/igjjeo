import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { goBack, request, state } = vi.hoisted(() => ({
  goBack: vi.fn(),
  request: vi.fn(),
  state: { canGoBack: true, isNativeShell: false },
}));

vi.mock("stack-link", () => ({
  useStackLinkBack: () => ({ goBack, canGoBack: state.canGoBack }),
}));

vi.mock("@geongyu/bridge/web", () => ({
  useBridge: () => ({ request }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

import { useStackBack } from "./index";

describe("useStackBack", () => {
  it("웹 스택이 남아 있으면(canGoBack) goBack을 호출한다", () => {
    goBack.mockClear();
    request.mockClear();
    state.canGoBack = true;
    const { result } = renderHook(() => useStackBack());
    result.current();
    expect(goBack).toHaveBeenCalledWith({ animation: "slide" });
    expect(request).not.toHaveBeenCalled();
  });

  it("웹 스택이 비고(canGoBack=false) 네이티브 셸 안이면 bridge로 popScreen을 요청한다", () => {
    goBack.mockClear();
    request.mockClear();
    state.canGoBack = false;
    state.isNativeShell = true;
    const { result } = renderHook(() => useStackBack());
    result.current();
    expect(goBack).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "popScreen" },
    });
  });

  it("웹 스택이 비고 브라우저면 아무 것도 하지 않는다", () => {
    goBack.mockClear();
    request.mockClear();
    state.canGoBack = false;
    state.isNativeShell = false;
    const { result } = renderHook(() => useStackBack());
    result.current();
    expect(goBack).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
});
