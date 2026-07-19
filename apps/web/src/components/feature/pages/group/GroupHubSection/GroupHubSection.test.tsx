import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { enterRoom, navigate, mutate, logout, state } = vi.hoisted(() => ({
  enterRoom: vi.fn(),
  navigate: vi.fn(),
  mutate: vi.fn(),
  logout: vi.fn(),
  state: {
    groups: [] as {
      id: string;
      name: string;
      member_count: number;
      role: string;
    }[],
    isPending: false,
    isError: false,
    isLoggingOut: false,
  },
}));

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({
    me: { display_name: "나" },
    groups: state.groups,
    activeGroupId: null,
  }),
}));

vi.mock("@/hooks/common/useEnterRoom", () => ({
  useEnterRoom: () => enterRoom,
}));

vi.mock("@/hooks/features/query/mutations/useJoinGroupMutation", () => ({
  useJoinGroupMutation: () => ({
    mutate,
    isPending: state.isPending,
    isError: state.isError,
  }),
}));

vi.mock("@/hooks/features/query/mutations/useLogoutMutation", () => ({
  useLogoutMutation: () => ({
    mutate: logout,
    isPending: state.isLoggingOut,
  }),
}));

vi.mock("stack-link", () => ({
  useStackLinkRouter: () => ({ navigate, isNavigating: false }),
}));

import { GroupHubSection } from ".";

describe("GroupHubSection", () => {
  beforeEach(() => {
    enterRoom.mockClear();
    navigate.mockClear();
    mutate.mockClear();
    logout.mockClear();
    state.groups = [];
    state.isPending = false;
    state.isError = false;
    state.isLoggingOut = false;
  });

  it("방이 없으면 빈 상태를 보여준다", () => {
    render(<GroupHubSection />);
    expect(screen.getByText("아직 참여한 방이 없어요")).toBeInTheDocument();
  });

  it("내 방 목록을 보여주고, 방을 누르면 그 방으로 진입한다", async () => {
    state.groups = [
      { id: "g1", name: "3조 뉴스룸", member_count: 9, role: "owner" },
      { id: "g2", name: "테니스 모임", member_count: 5, role: "member" },
    ];
    render(<GroupHubSection />);
    expect(screen.getByText("3조 뉴스룸")).toBeInTheDocument();
    expect(screen.getByText("테니스 모임")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /테니스 모임/ }));
    expect(enterRoom).toHaveBeenCalledWith("g2");
  });

  it("초대 코드로 참여하면 참여한 방으로 진입한다", async () => {
    mutate.mockImplementation(
      (
        _params: { inviteCode: string },
        opts: { onSuccess: (group: { id: string }) => void },
      ) => opts.onSuccess({ id: "g3" }),
    );
    render(<GroupHubSection />);

    await userEvent.type(screen.getByLabelText("초대 코드"), "a1b2c3");
    await userEvent.click(screen.getByRole("button", { name: "참여" }));

    expect(mutate).toHaveBeenCalledWith(
      { inviteCode: "a1b2c3" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(enterRoom).toHaveBeenCalledWith("g3");
  });

  it("코드가 비어 있으면 참여 버튼이 비활성이라 참여를 시도하지 않는다", () => {
    render(<GroupHubSection />);
    expect(screen.getByRole("button", { name: "참여" })).toBeDisabled();
  });

  it("새 뉴스룸 만들기를 누르면 /group/new 로 이동한다", async () => {
    render(<GroupHubSection />);
    await userEvent.click(
      screen.getByRole("button", { name: /새 뉴스룸 만들기/ }),
    );
    expect(navigate).toHaveBeenCalledWith({
      href: "/group/new",
      animation: "slide",
    });
  });

  it("하단 로그아웃 버튼을 누르면 로그아웃한다", async () => {
    render(<GroupHubSection />);
    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));
    expect(logout).toHaveBeenCalled();
  });

  it("로그아웃 중에는 버튼이 비활성이다", () => {
    state.isLoggingOut = true;
    render(<GroupHubSection />);
    expect(screen.getByRole("button", { name: "로그아웃 중…" })).toBeDisabled();
  });
});
