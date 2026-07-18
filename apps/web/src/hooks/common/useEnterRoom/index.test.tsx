import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigate, request, state, set } = vi.hoisted(() => ({
  navigate: vi.fn(),
  request: vi.fn(),
  state: { isNativeShell: false },
  set: vi.fn(),
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

vi.mock("@/lib/session/activeGroupStore", () => ({
  activeGroupStore: { set },
}));

import { useEnterRoom } from ".";

describe("useEnterRoom", () => {
  beforeEach(() => {
    navigate.mockClear();
    request.mockClear();
    set.mockClear();
    state.isNativeShell = false;
  });

  it("고른 방을 활성 방으로 저장한다", () => {
    const { result } = renderHook(() => useEnterRoom());
    result.current("g1");
    expect(set).toHaveBeenCalledWith("g1");
  });

  it("브라우저(네이티브 셸 아님)에서는 stack-link로 피드(/)로 이동한다", () => {
    const { result } = renderHook(() => useEnterRoom());
    result.current("g1");

    expect(navigate).toHaveBeenCalledWith({ href: "/", animation: "none" });
    expect(request).not.toHaveBeenCalled();
  });

  it("네이티브 셸 안에서는 bridge로 enterRoom을 요청한다", () => {
    state.isNativeShell = true;

    const { result } = renderHook(() => useEnterRoom());
    result.current("g1");

    expect(request).toHaveBeenCalledWith({
      requestMessage: { type: "enterRoom", payload: { groupId: "g1" } },
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
