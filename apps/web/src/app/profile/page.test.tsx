import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const openScreen = vi.fn();
const logoutMutate = vi.fn();
let logoutPending = false;
let quota: { limit: number; used: number; remaining: number } | undefined = {
  limit: 5,
  used: 5,
  remaining: 0,
};

vi.mock("@/hooks/common/useOpenScreen", () => ({
  useOpenScreen: () => openScreen,
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({
    me: { display_name: "김건규" },
    groups: [],
    activeGroupId: null,
  }),
}));

vi.mock("@/hooks/features/query/mutations/useLogoutMutation", () => ({
  useLogoutMutation: () => ({
    mutate: logoutMutate,
    isPending: logoutPending,
  }),
}));

vi.mock("@/hooks/features/query/querys/useReportQuotaQuery", () => ({
  useReportQuotaQuery: () => ({ data: quota }),
}));

import ProfilePage from "./page";

describe("ProfilePage", () => {
  beforeEach(() => {
    openScreen.mockClear();
    logoutMutate.mockClear();
    logoutPending = false;
    quota = { limit: 5, used: 5, remaining: 0 };
  });

  it("언론사 구독 UI를 노출하지 않는다", () => {
    render(<ProfilePage />);
    expect(screen.queryByText(/구독/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /구독/ }),
    ).not.toBeInTheDocument();
  });

  it("설정 섹션에 로그아웃 버튼을 렌더링한다", () => {
    render(<ProfilePage />);
    expect(screen.getByText("설정")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeEnabled();
  });

  it("로그아웃을 누르면 로그아웃 mutation을 실행한다", async () => {
    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));
    expect(logoutMutate).toHaveBeenCalledTimes(1);
  });

  it("로그아웃 진행 중에는 버튼을 비활성화한다", () => {
    logoutPending = true;
    render(<ProfilePage />);
    expect(screen.getByRole("button", { name: "로그아웃 중…" })).toBeDisabled();
  });

  describe("제보 한도", () => {
    it("오늘 남은 제보 횟수를 표시한다", () => {
      quota = { limit: 5, used: 3, remaining: 2 };
      render(<ProfilePage />);
      expect(
        screen.getByText("오늘 제보 한도 5회 중 2회 남음"),
      ).toBeInTheDocument();
    });

    it("한도가 남아 있으면 충전 버튼을 비활성화한다", () => {
      quota = { limit: 5, used: 3, remaining: 2 };
      render(<ProfilePage />);
      expect(screen.getByRole("button", { name: "충전하기" })).toBeDisabled();
    });

    it("한도를 다 쓰면 충전 버튼을 눌러 충전 화면을 연다", async () => {
      quota = { limit: 5, used: 5, remaining: 0 };
      render(<ProfilePage />);

      const button = screen.getByRole("button", { name: "충전하기" });
      expect(button).toBeEnabled();
      await userEvent.click(button);

      expect(openScreen).toHaveBeenCalledWith("/recharge");
    });

    it("한도를 아직 못 불러왔으면 제보 한도 섹션을 렌더링하지 않는다", () => {
      quota = undefined;
      render(<ProfilePage />);
      expect(screen.queryByText("제보 한도")).not.toBeInTheDocument();
    });
  });
});
