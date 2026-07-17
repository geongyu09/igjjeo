import { beforeEach, describe, expect, it, vi } from "vitest";

// 데이터 계층은 apiClient에만 의존한다 — 인스턴스를 목으로 대체해 URL·본문·반환을 검증.
const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
    delete: (...a: unknown[]) => del(...a),
  },
}));

import {
  createGroup,
  joinGroup,
  listGroups,
  listMembers,
  removeMember,
} from "./groups";

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  patch.mockReset();
  del.mockReset();
});

describe("groups 데이터 계층", () => {
  it("createGroup은 POST /groups에 name을 보내고 생성 리소스를 반환한다", async () => {
    post.mockResolvedValue({ data: { id: "g1", name: "3조" } });
    const result = await createGroup({ name: "3조" });

    expect(post).toHaveBeenCalledWith("/groups", { name: "3조" });
    expect(result).toEqual({ id: "g1", name: "3조" });
  });

  it("listGroups는 페이지 파라미터를 params로 전달한다", async () => {
    post.mockClear();
    get.mockResolvedValue({ data: { items: [], next_cursor: null } });
    await listGroups({ limit: 10, cursor: "c1" });

    expect(get).toHaveBeenCalledWith("/groups", {
      params: { limit: 10, cursor: "c1" },
    });
  });

  it("joinGroup은 invite_code로 스네이크케이스 변환해 보낸다", async () => {
    post.mockResolvedValue({ data: { id: "g1" } });
    await joinGroup({ inviteCode: "AB12CD" });

    expect(post).toHaveBeenCalledWith("/groups/join", {
      invite_code: "AB12CD",
    });
  });

  it("listMembers는 방 스코프 경로를 사용한다", async () => {
    get.mockResolvedValue({ data: { items: [] } });
    await listMembers({ groupId: "g1" });

    expect(get).toHaveBeenCalledWith("/groups/g1/members");
  });

  it("removeMember는 DELETE 멤버 경로를 호출한다", async () => {
    del.mockResolvedValue({ status: 204 });
    await removeMember({ groupId: "g1", userId: "u2" });

    expect(del).toHaveBeenCalledWith("/groups/g1/members/u2");
  });
});
