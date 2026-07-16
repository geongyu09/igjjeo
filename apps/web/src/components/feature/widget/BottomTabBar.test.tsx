import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate, isNavigating: false }),
}));

import { BottomTabBar } from "./BottomTabBar";

describe("BottomTabBar", () => {
  it("기본 탭(피드·검색·제보·알림·프로필)을 렌더링한다", () => {
    render(<BottomTabBar active="feed" />);
    for (const label of ["피드", "검색", "제보", "알림", "프로필"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("active 탭에 aria-current=page를 준다", () => {
    render(<BottomTabBar active="profile" />);
    expect(screen.getByRole("button", { name: /프로필/ })).toHaveAttribute("aria-current", "page");
  });

  it("피드 탭을 누르면 '/'로 전환한다", async () => {
    navigate.mockClear();
    render(<BottomTabBar active="profile" />);
    await userEvent.click(screen.getByRole("button", { name: /피드/ }));
    expect(navigate).toHaveBeenCalledWith({ href: "/", animation: "none" });
  });

  it("제보 FAB를 누르면 /report로 슬라이드 전환한다", async () => {
    navigate.mockClear();
    render(<BottomTabBar active="feed" />);
    await userEvent.click(screen.getByRole("button", { name: "제보하기" }));
    expect(navigate).toHaveBeenCalledWith({ href: "/report", animation: "slide" });
  });

  it("showDigest면 알림 대신 결산 탭을 보여준다", () => {
    render(<BottomTabBar active="digest" showDigest />);
    expect(screen.getByText("결산")).toBeInTheDocument();
    expect(screen.queryByText("알림")).not.toBeInTheDocument();
  });
});
