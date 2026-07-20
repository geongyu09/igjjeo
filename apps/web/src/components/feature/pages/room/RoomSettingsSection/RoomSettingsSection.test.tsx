import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Group, Member } from "@/lib/api/types";

const mutate = vi.fn();
let mutationState = { isPending: false, isError: false };

let group: Group = {
  id: "g1",
  name: "부트캠프 3조",
  invite_code: "AB12CD",
  role: "owner",
  member_count: 2,
  created_at: "2026-07-17T00:00:00.000Z",
  keyword: "지각 대장들",
};

let members: Member[] = [
  {
    user_id: "u1",
    display_name: "김건규",
    masked_name: "김*규",
    role: "owner",
    joined_at: "2026-07-17T00:00:00.000Z",
  },
  {
    user_id: "u2",
    display_name: "이영희",
    masked_name: "이*희",
    role: "member",
    joined_at: "2026-07-17T01:00:00.000Z",
  },
];

vi.mock("@/hooks/features/query/suspenseQuerys/useGroupSuspenseQuery", () => ({
  useGroupSuspenseQuery: () => ({ data: group }),
}));

vi.mock(
  "@/hooks/features/query/suspenseQuerys/useGroupMembersSuspenseQuery",
  () => ({
    useGroupMembersSuspenseQuery: () => ({ data: { items: members } }),
  }),
);

vi.mock("@/hooks/features/query/mutations/useUpdateGroupMutation", () => ({
  useUpdateGroupMutation: () => ({ mutate, ...mutationState }),
}));

import { RoomSettingsSection } from "./index";

describe("RoomSettingsSection", () => {
  beforeEach(() => {
    mutate.mockClear();
    mutationState = { isPending: false, isError: false };
    group = {
      id: "g1",
      name: "부트캠프 3조",
      invite_code: "AB12CD",
      role: "owner",
      member_count: 2,
      created_at: "2026-07-17T00:00:00.000Z",
      keyword: "지각 대장들",
    };
    members = [
      {
        user_id: "u1",
        display_name: "김건규",
        masked_name: "김*규",
        role: "owner",
        joined_at: "2026-07-17T00:00:00.000Z",
      },
      {
        user_id: "u2",
        display_name: "이영희",
        masked_name: "이*희",
        role: "member",
        joined_at: "2026-07-17T01:00:00.000Z",
      },
    ];
  });

  it("방 이름과 멤버 수를 보여준다", () => {
    render(<RoomSettingsSection groupId="g1" />);
    expect(screen.getByText("부트캠프 3조")).toBeInTheDocument();
    expect(screen.getByText("멤버 2명")).toBeInTheDocument();
  });

  it("컨텍스트(키워드)를 보여준다", () => {
    render(<RoomSettingsSection groupId="g1" />);
    expect(screen.getByText("지각 대장들")).toBeInTheDocument();
  });

  it("멤버 이름·마스킹명과 방장 배지를 보여준다", () => {
    render(<RoomSettingsSection groupId="g1" />);
    expect(screen.getByText("김건규")).toBeInTheDocument();
    expect(screen.getByText("김*규")).toBeInTheDocument();
    expect(screen.getByText("이영희")).toBeInTheDocument();
    expect(screen.getByText("방장")).toBeInTheDocument();
  });

  it("방장은 컨텍스트를 수정할 수 있다", async () => {
    render(<RoomSettingsSection groupId="g1" />);

    await userEvent.click(
      screen.getByRole("button", { name: "컨텍스트 수정" }),
    );

    const textarea = screen.getByLabelText("방 컨텍스트");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "밤샘 코딩");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(mutate).toHaveBeenCalledWith(
      { groupId: "g1", keyword: "밤샘 코딩" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("방장이 아니면 컨텍스트 수정 버튼이 없다", () => {
    group = { ...group, role: "member" };
    render(<RoomSettingsSection groupId="g1" />);
    expect(
      screen.queryByRole("button", { name: /컨텍스트/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("지각 대장들")).toBeInTheDocument();
  });

  it("컨텍스트가 없으면 안내 문구와 추가 버튼(방장)을 보여준다", () => {
    group = { ...group, keyword: null };
    render(<RoomSettingsSection groupId="g1" />);
    expect(screen.getByText("아직 컨텍스트가 없어요")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "컨텍스트 추가" }),
    ).toBeInTheDocument();
  });
});
