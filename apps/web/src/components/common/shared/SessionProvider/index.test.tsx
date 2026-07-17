import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({ state: { hasSession: false } }));

vi.mock("@/hooks/common/useHasSession", () => ({
  useHasSession: () => state.hasSession,
}));

vi.mock("./components/AuthScreen", () => ({
  AuthScreen: () => <div data-testid="auth-screen">로그인</div>,
}));

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useMeSuspenseQuery",
  () => ({
    useMeSuspenseQuery: () => ({ data: { id: "u1", display_name: "나" } }),
  }),
);

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useGroupsSuspenseQuery",
  () => ({
    useGroupsSuspenseQuery: () => ({ data: { pages: [{ items: [] }] } }),
  }),
);

import { SessionProvider } from ".";

describe("SessionProvider 게이트", () => {
  beforeEach(() => {
    state.hasSession = false;
  });

  it("미인증이면 로그인 화면을 렌더하고 앱은 렌더하지 않는다", () => {
    render(
      <SessionProvider>
        <div data-testid="app">앱</div>
      </SessionProvider>,
    );
    expect(screen.getByTestId("auth-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
  });

  it("인증되면 앱을 렌더하고 로그인 화면은 렌더하지 않는다", () => {
    state.hasSession = true;
    render(
      <SessionProvider>
        <div data-testid="app">앱</div>
      </SessionProvider>,
    );
    expect(screen.getByTestId("app")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-screen")).not.toBeInTheDocument();
  });
});
