import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { request, state } = vi.hoisted(() => ({
  request: vi.fn(),
  state: { isNativeShell: true },
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({ request }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => state.isNativeShell,
}));

import { useLockReportModal } from "./index";

describe("useLockReportModal", () => {
  it("잠금(locked=true)이면 네이티브 모달 닫기를 막도록 요청한다", () => {
    request.mockClear();
    state.isNativeShell = true;
    renderHook(() => useLockReportModal(true));
    expect(request).toHaveBeenCalledWith({
      requestMessage: {
        type: "setReportModalDismissible",
        payload: { dismissible: false },
      },
    });
  });

  it("잠금이 풀리면 다시 닫을 수 있도록 요청한다", () => {
    request.mockClear();
    state.isNativeShell = true;
    const { rerender } = renderHook(
      ({ locked }: { locked: boolean }) => useLockReportModal(locked),
      { initialProps: { locked: true } },
    );
    request.mockClear();
    rerender({ locked: false });
    expect(request).toHaveBeenCalledWith({
      requestMessage: {
        type: "setReportModalDismissible",
        payload: { dismissible: true },
      },
    });
  });

  // 잠금 중 화면이 사라지면 모달이 영영 닫히지 않는다 — 언마운트 시 반드시 푼다.
  it("잠금 상태로 언마운트되면 잠금을 해제한다", () => {
    request.mockClear();
    state.isNativeShell = true;
    const { unmount } = renderHook(() => useLockReportModal(true));
    request.mockClear();
    unmount();
    expect(request).toHaveBeenCalledWith({
      requestMessage: {
        type: "setReportModalDismissible",
        payload: { dismissible: true },
      },
    });
  });

  it("브라우저(비네이티브)에서는 아무 것도 전송하지 않는다", () => {
    request.mockClear();
    state.isNativeShell = false;
    renderHook(() => useLockReportModal(true));
    expect(request).not.toHaveBeenCalled();
  });
});
