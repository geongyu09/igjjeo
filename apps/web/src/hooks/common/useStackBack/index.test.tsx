import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { goBack, state } = vi.hoisted(() => ({
  goBack: vi.fn(),
  state: { canGoBack: true },
}));

vi.mock("stack-link", () => ({
  useStackLinkBack: () => ({ goBack, canGoBack: state.canGoBack }),
}));

import { useStackBack } from "./index";

describe("useStackBack", () => {
  it("웹 스택이 남아 있으면(canGoBack) goBack을 호출한다", () => {
    goBack.mockClear();
    state.canGoBack = true;
    const { result } = renderHook(() => useStackBack());
    result.current();
    expect(goBack).toHaveBeenCalledWith({ animation: "slide" });
  });

  it("웹 스택이 비면(canGoBack=false) goBack을 호출하지 않는다", () => {
    goBack.mockClear();
    state.canGoBack = false;
    const { result } = renderHook(() => useStackBack());
    result.current();
    expect(goBack).not.toHaveBeenCalled();
  });
});
