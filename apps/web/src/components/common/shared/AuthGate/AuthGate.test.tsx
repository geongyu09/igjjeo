import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({ state: { pathname: "/" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

import { AuthGate } from ".";

describe("AuthGate", () => {
  beforeEach(() => {
    state.pathname = "/";
  });

  it("일반 화면은 세션 게이트로 감싼다", () => {
    render(
      <AuthGate>
        <span>피드</span>
      </AuthGate>,
    );
    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByText("피드")).toBeInTheDocument();
  });

  it("온보딩은 로그인 전 화면이라 세션 게이트 없이 그린다", () => {
    state.pathname = "/onboarding";
    render(
      <AuthGate>
        <span>온보딩</span>
      </AuthGate>,
    );
    expect(screen.queryByTestId("session-provider")).not.toBeInTheDocument();
    expect(screen.getByText("온보딩")).toBeInTheDocument();
  });
});
