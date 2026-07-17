import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { goBack, state } = vi.hoisted(() => ({
  goBack: vi.fn(),
  state: { canGoBack: true },
}));

vi.mock("stack-link", () => ({
  useStackLinkBack: () => ({ goBack, canGoBack: state.canGoBack }),
}));

import { useNativeBackBridge } from "./index";

describe("useNativeBackBridge", () => {
  it("웹 스택이 남아 있으면(canGoBack) back 요청에 goBack하고 consumed:true를 응답한다", () => {
    goBack.mockClear();
    state.canGoBack = true;
    const { result } = renderHook(() => useNativeBackBridge());
    const res = result.current({ type: "back" });
    expect(goBack).toHaveBeenCalledWith({ animation: "slide" });
    expect(res).toEqual({ consumed: true });
  });

  it("웹 스택이 비면(canGoBack=false) goBack하지 않고 consumed:false를 응답한다 (네이티브가 pop)", () => {
    goBack.mockClear();
    state.canGoBack = false;
    const { result } = renderHook(() => useNativeBackBridge());
    const res = result.current({ type: "back" });
    expect(goBack).not.toHaveBeenCalled();
    expect(res).toEqual({ consumed: false });
  });
});
