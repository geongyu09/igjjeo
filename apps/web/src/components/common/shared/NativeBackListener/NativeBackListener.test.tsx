import type {
  NativeToWebRequest,
  NativeToWebResponse,
} from "@igjjeo/bridge-contract";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { backHandler, focusHandler, state, listenerSpy } = vi.hoisted(() => ({
  backHandler: vi.fn((): NativeToWebResponse => ({ consumed: false })),
  focusHandler: vi.fn((): NativeToWebResponse => ({ consumed: true })),
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
  useNativeBackBridge: () => backHandler,
}));

vi.mock("@/hooks/common/useNativeFocusRefetch", () => ({
  useNativeFocusRefetch: () => focusHandler,
}));

const { syncSpy, revokeSyncSpy } = vi.hoisted(() => ({
  syncSpy: vi.fn(),
  revokeSyncSpy: vi.fn(),
}));

vi.mock("@/hooks/common/useSyncSwipeBackGesture", () => ({
  useSyncSwipeBackGesture: syncSpy,
}));

vi.mock("@/hooks/common/useSyncNativeSessionRevoke", () => ({
  useSyncNativeSessionRevoke: revokeSyncSpy,
}));

import { NativeBackListener } from "./index";

// listenerSpy에 전달된 onRequest 핸들러를 꺼낸다.
function capturedOnRequest(): (
  message: NativeToWebRequest,
) => NativeToWebResponse {
  const props = listenerSpy.mock.calls.at(-1)?.[0] as {
    onRequest: (message: NativeToWebRequest) => NativeToWebResponse;
  };
  return props.onRequest;
}

describe("NativeBackListener", () => {
  it("stack-link preLoad iframe 안에서는 리스너도 제스처 동기화도 하지 않는다", () => {
    listenerSpy.mockClear();
    syncSpy.mockClear();
    revokeSyncSpy.mockClear();
    state.inFrame = true;
    const { queryByTestId } = render(<NativeBackListener />);
    expect(queryByTestId("bridge-listener")).toBeNull();
    expect(listenerSpy).not.toHaveBeenCalled();
    expect(syncSpy).not.toHaveBeenCalled();
    expect(revokeSyncSpy).not.toHaveBeenCalled();
  });

  it("최상위 웹뷰에서는 요청 핸들러 리스너를 마운트하고 스와이프 백 제스처를 동기화한다", () => {
    listenerSpy.mockClear();
    syncSpy.mockClear();
    state.inFrame = false;
    const { getByTestId } = render(<NativeBackListener />);
    expect(getByTestId("bridge-listener")).toBeTruthy();
    expect(listenerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ onRequest: expect.any(Function) }),
    );
    expect(syncSpy).toHaveBeenCalled();
  });

  // 401 로 세션이 폐기되면 네이티브 세션까지 지워야 복원 루프에 빠지지 않는다.
  it("최상위 웹뷰에서 세션 폐기 전파를 마운트한다", () => {
    revokeSyncSpy.mockClear();
    state.inFrame = false;
    render(<NativeBackListener />);
    expect(revokeSyncSpy).toHaveBeenCalled();
  });

  it("back 요청은 back 핸들러로, focus 요청은 focus 핸들러로 위임한다", () => {
    listenerSpy.mockClear();
    backHandler.mockClear();
    focusHandler.mockClear();
    state.inFrame = false;
    render(<NativeBackListener />);
    const onRequest = capturedOnRequest();

    onRequest({ type: "back" });
    expect(backHandler).toHaveBeenCalledTimes(1);
    expect(focusHandler).not.toHaveBeenCalled();

    const res = onRequest({ type: "focus" });
    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(backHandler).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ consumed: true });
  });
});
