import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replaceScreen = vi.fn();
let activeGroupId: string | null = "g1";

vi.mock("@/components/common/shared/SessionProvider", () => ({
  useSession: () => ({
    me: { display_name: "김건규" },
    groups: [],
    activeGroupId,
  }),
}));

vi.mock("@/hooks/common/useReplaceScreen", () => ({
  useReplaceScreen: () => replaceScreen,
}));

vi.mock("@/components/feature/pages/room/RoomSettingsSection", () => ({
  RoomSettingsSection: ({ groupId }: { groupId: string }) => (
    <div data-testid="room-settings">{groupId}</div>
  ),
}));

import RoomPage from "./page";

describe("RoomPage", () => {
  beforeEach(() => {
    replaceScreen.mockClear();
    activeGroupId = "g1";
  });

  it("뉴스룸 타이틀을 렌더링한다", () => {
    render(<RoomPage />);
    expect(screen.getByText("뉴스룸")).toBeInTheDocument();
  });

  it("활성 방이 있으면 방 설정 섹션을 렌더링한다", () => {
    render(<RoomPage />);
    expect(screen.getByTestId("room-settings")).toHaveTextContent("g1");
  });

  it("활성 방이 없으면 빈 상태를 보여주고 방 고르기로 이동한다", async () => {
    activeGroupId = null;
    render(<RoomPage />);

    expect(screen.getByText("아직 참여한 방이 없어요")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "방 고르기" }));
    expect(replaceScreen).toHaveBeenCalledWith("/group");
  });
});
