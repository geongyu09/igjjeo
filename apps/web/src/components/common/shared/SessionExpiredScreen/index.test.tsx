import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { recover, recovery } = vi.hoisted(() => {
  const recover = vi.fn();
  return { recover, recovery: vi.fn(() => recover) };
});

vi.mock("@/hooks/common/useSessionExpiredRecovery", () => ({
  useSessionExpiredRecovery: recovery,
}));

import { SessionExpiredScreen } from ".";

describe("SessionExpiredScreen", () => {
  it("'로그인이 필요해요' 안내와 로그인 버튼을 그린다", () => {
    render(<SessionExpiredScreen />);
    expect(screen.getByText("로그인이 필요해요")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "로그인 하러 가기" }),
    ).toBeInTheDocument();
  });

  it("마운트만으로는 복구를 실행하지 않는다", () => {
    recover.mockClear();
    render(<SessionExpiredScreen />);
    expect(recover).not.toHaveBeenCalled();
  });

  it("로그인 버튼을 누르면 로그아웃 후 로그인 화면으로 되돌린다", async () => {
    recover.mockClear();
    render(<SessionExpiredScreen />);
    await userEvent.click(
      screen.getByRole("button", { name: "로그인 하러 가기" }),
    );
    expect(recover).toHaveBeenCalledTimes(1);
  });
});
