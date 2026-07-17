import { NotFoundException } from "@nestjs/common";

import type { GroupsRepository } from "./groups.repository";
import { GroupMembershipGuard } from "./group-membership.guard";

function contextWith(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as Parameters<GroupMembershipGuard["canActivate"]>[0];
}

function makeGuard(membership: { role: string } | null) {
  const groups = {
    findMembership: jest.fn().mockResolvedValue(membership),
  } as unknown as jest.Mocked<GroupsRepository>;
  return { guard: new GroupMembershipGuard(groups), groups };
}

describe("GroupMembershipGuard", () => {
  it("멤버이면 통과시키고 request.membership 에 역할을 싣는다", async () => {
    const { guard, groups } = makeGuard({ role: "owner" });
    const request: Record<string, unknown> = {
      user: { id: "u1" },
      params: { groupId: "g1" },
    };

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(groups.findMembership).toHaveBeenCalledWith("g1", "u1");
    expect(request.membership).toEqual({ groupId: "g1", role: "owner" });
  });

  it("비멤버이면 404 로 존재를 은닉한다", async () => {
    const { guard } = makeGuard(null);
    const request = { user: { id: "u1" }, params: { groupId: "g1" } };

    await expect(
      guard.canActivate(contextWith(request)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("groupId 파라미터가 없으면 404", async () => {
    const { guard } = makeGuard({ role: "member" });
    const request = { user: { id: "u1" }, params: {} };

    await expect(
      guard.canActivate(contextWith(request)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
