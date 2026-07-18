import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    hasSession: false,
    restore: "restoring" as "restoring" | "unavailable",
    onboarded: true,
    groups: [] as { id: string; name: string; member_count: number }[],
    activeStored: null as string | null,
  },
}));

vi.mock("@/hooks/common/useHasSession", () => ({
  useHasSession: () => state.hasSession,
}));

vi.mock("@/hooks/common/useRestoreNativeSession", () => ({
  useRestoreNativeSession: () => state.restore,
}));

vi.mock("@/hooks/common/useActiveGroupId", () => ({
  useActiveGroupId: () => state.activeStored,
}));

vi.mock("./components/NoSessionScreen", () => ({
  NoSessionScreen: () => <div data-testid="no-session">로그인 안내</div>,
}));

vi.mock("./components/OnboardingForm", () => ({
  OnboardingForm: () => <div data-testid="onboarding">이름 입력</div>,
}));

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useMeSuspenseQuery",
  () => ({
    useMeSuspenseQuery: () => ({
      data: { id: "u1", display_name: "나", onboarded: state.onboarded },
    }),
  }),
);

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useGroupsSuspenseQuery",
  () => ({
    useGroupsSuspenseQuery: () => ({
      data: { pages: [{ items: state.groups }] },
    }),
  }),
);

import { SessionProvider, useSession } from ".";

function renderGate() {
  render(
    <SessionProvider>
      <div data-testid="app">앱</div>
    </SessionProvider>,
  );
}

function ActiveGroupProbe() {
  const { activeGroupId } = useSession();
  return <div data-testid="active">{activeGroupId ?? "none"}</div>;
}

function renderProbe() {
  render(
    <SessionProvider>
      <ActiveGroupProbe />
    </SessionProvider>,
  );
}

describe("SessionProvider 게이트", () => {
  beforeEach(() => {
    state.hasSession = false;
    state.restore = "restoring";
    state.onboarded = true;
    state.groups = [];
    state.activeStored = null;
  });

  it("세션이 없고 네이티브 세션 복원 중이면 로딩을 렌더한다", () => {
    state.restore = "restoring";
    renderGate();
    expect(screen.getByText("세션 확인 중")).toBeInTheDocument();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
  });

  it("세션이 없고 복원이 불가하면(브라우저·실패) 안내 화면을 렌더한다", () => {
    state.restore = "unavailable";
    renderGate();
    expect(screen.getByTestId("no-session")).toBeInTheDocument();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
  });

  it("인증되고 온보딩을 마쳤으면 앱을 렌더한다", () => {
    state.hasSession = true;
    state.onboarded = true;
    renderGate();
    expect(screen.getByTestId("app")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding")).not.toBeInTheDocument();
  });

  it("인증됐지만 온보딩 미완료면 온보딩 화면을 렌더한다", () => {
    state.hasSession = true;
    state.onboarded = false;
    renderGate();
    expect(screen.getByTestId("onboarding")).toBeInTheDocument();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
  });
});

describe("SessionProvider 활성 방", () => {
  beforeEach(() => {
    state.hasSession = true;
    state.restore = "restoring";
    state.onboarded = true;
    state.groups = [{ id: "g1", name: "3조 뉴스룸", member_count: 9 }];
    state.activeStored = null;
  });

  it("고른 방이 없으면 activeGroupId는 null", () => {
    state.activeStored = null;
    renderProbe();
    expect(screen.getByTestId("active")).toHaveTextContent("none");
  });

  it("고른 방이 내 방 목록에 있으면 그 방을 활성 방으로 쓴다", () => {
    state.activeStored = "g1";
    renderProbe();
    expect(screen.getByTestId("active")).toHaveTextContent("g1");
  });

  it("고른 방이 내 방 목록에 없으면(나간 방 등) activeGroupId는 null", () => {
    state.activeStored = "gX";
    renderProbe();
    expect(screen.getByTestId("active")).toHaveTextContent("none");
  });
});
