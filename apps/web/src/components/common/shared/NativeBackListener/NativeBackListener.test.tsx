import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { handler, state, listenerSpy } = vi.hoisted(() => ({
  handler: vi.fn(),
  state: { inFrame: false },
  listenerSpy: vi.fn(),
}));

vi.mock("stack-link", () => ({
  isInStackFrame: () => state.inFrame,
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  BridgeRequestListener: (props: unknown) => {
    listenerSpy(props);
    return <div data-testid="bridge-listener" />;
  },
}));

vi.mock("@/hooks/common/useNativeBackBridge", () => ({
  useNativeBackBridge: () => handler,
}));

const { syncSpy } = vi.hoisted(() => ({ syncSpy: vi.fn() }));

vi.mock("@/hooks/common/useSyncSwipeBackGesture", () => ({
  useSyncSwipeBackGesture: syncSpy,
}));

import { NativeBackListener } from "./index";

describe("NativeBackListener", () => {
  it("stack-link preLoad iframe 안에서는 리스너도 제스처 동기화도 하지 않는다", () => {
    listenerSpy.mockClear();
    syncSpy.mockClear();
    state.inFrame = true;
    const { queryByTestId } = render(<NativeBackListener />);
    expect(queryByTestId("bridge-listener")).toBeNull();
    expect(listenerSpy).not.toHaveBeenCalled();
    expect(syncSpy).not.toHaveBeenCalled();
  });

  it("최상위 웹뷰에서는 back 핸들러 리스너를 마운트하고 스와이프 백 제스처를 동기화한다", () => {
    listenerSpy.mockClear();
    syncSpy.mockClear();
    state.inFrame = false;
    const { getByTestId } = render(<NativeBackListener />);
    expect(getByTestId("bridge-listener")).toBeTruthy();
    expect(listenerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ onRequest: handler }),
    );
    expect(syncSpy).toHaveBeenCalled();
  });
});
