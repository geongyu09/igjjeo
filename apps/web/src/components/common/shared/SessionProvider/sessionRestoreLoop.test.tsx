/**
 * 세션 복원 루프 회귀 테스트 — "세션 확인 중" 무한 로딩 재발 방지.
 *
 * 세션의 원천은 네이티브 secure-store다. 웹이 401로 토큰만 비우면 네이티브는 같은 죽은
 * 토큰을 그대로 갖고 있어, 게이트의 복원이 그것을 다시 받아오고 다시 401이 나는 사이클에
 * 갇힌다(화면은 로딩에서 벗어나지 못한다). 폐기 표시(revoke)로 복원을 막고 네이티브까지
 * 전파해 루프를 끊는지 계층을 가로질러 확인한다.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { bridge } = vi.hoisted(() => ({
  bridge: { getSessionCalls: 0, clearSessionCalls: 0 },
}));

vi.mock("@geongyu/react-native-bridge/web", () => ({
  useBridge: () => ({
    request: ({
      requestMessage,
      responseCallback,
    }: {
      requestMessage: { type: string };
      responseCallback?: (res: unknown) => void;
    }) => {
      if (requestMessage.type === "clearSession") {
        bridge.clearSessionCalls += 1;
        return;
      }
      if (requestMessage.type !== "getSession") return;
      bridge.getSessionCalls += 1;
      // 네이티브 secure-store 는 아직 죽은 토큰을 들고 있다.
      responseCallback?.({
        success: true,
        session: { access_token: "dead-T0", refresh_token: "dead-T0-refresh" },
      });
    },
  }),
}));

vi.mock("@/hooks/common/useIsNativeShell", () => ({
  useIsNativeShell: () => true,
}));

vi.mock("@/hooks/common/useActiveGroupId", () => ({
  useActiveGroupId: () => null,
}));

vi.mock("@/components/feature/pages/invite/PendingInviteConsumer", () => ({
  PendingInviteConsumer: () => null,
}));

vi.mock("./components/NoSessionScreen", () => ({
  NoSessionScreen: () => <div data-testid="no-session">로그인 안내</div>,
}));

vi.mock("./components/OnboardingForm", () => ({
  OnboardingForm: () => <div data-testid="onboarding">이름 입력</div>,
}));

// 부트스트랩 진입 = /me 401 → 갱신 실패 → 인터셉터가 세션을 폐기(revoke)한다.
vi.mock("@/hooks/features/query/suspenseQuerys/useMeSuspenseQuery", () => ({
  useMeSuspenseQuery: () => {
    useEffect(() => {
      const timer = setTimeout(() => tokenStore.revoke(), 10);
      return () => clearTimeout(timer);
    }, []);
    return { data: { id: "u1", display_name: "나", onboarded: true } };
  },
}));

vi.mock("@/hooks/features/query/suspenseQuerys/useGroupsSuspenseQuery", () => ({
  useGroupsSuspenseQuery: () => ({ data: { pages: [{ items: [] }] } }),
}));

import { useSyncNativeSessionRevoke } from "@/hooks/common/useSyncNativeSessionRevoke";
import { tokenStore } from "@/lib/api/tokenStore";
import { SessionProvider } from ".";

// 실제 앱에서는 NativeBackListener(루트 레이아웃)가 이 훅을 마운트한다.
function Harness() {
  useSyncNativeSessionRevoke();
  return (
    <SessionProvider>
      <div data-testid="app">앱</div>
    </SessionProvider>
  );
}

describe("세션 복원 루프 수정", () => {
  beforeEach(() => {
    bridge.getSessionCalls = 0;
    bridge.clearSessionCalls = 0;
    localStorage.clear();
    tokenStore.reset();
  });

  it("401 폐기 후에는 죽은 토큰을 다시 복원하지 않고 멈춘다", async () => {
    render(<Harness />);

    // 폐기가 화면에 반영될 때까지 기다린다 — 로딩이 아니라 안내 화면으로 끝나야 한다.
    await waitFor(() => expect(screen.getByTestId("no-session")).toBeTruthy());

    // 루프가 있었다면 여기서 getSession 이 계속 늘어난다.
    const callsAtStop = bridge.getSessionCalls;
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(bridge.getSessionCalls).toBe(callsAtStop);
    expect(bridge.getSessionCalls).toBeLessThanOrEqual(2);
    expect(screen.queryByText("세션 확인 중")).not.toBeInTheDocument();
    // 네이티브 secure-store 도 비우도록 전파됐다.
    expect(bridge.clearSessionCalls).toBe(1);
  });
});
