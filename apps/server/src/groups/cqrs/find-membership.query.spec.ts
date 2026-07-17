import type { GroupsRepository } from "../groups.repository";
import { FindMembershipHandler, FindMembershipQuery } from "./find-membership.query";

describe("FindMembershipHandler", () => {
  it("GroupsRepository.findMembership 로 위임한다", async () => {
    const groups = {
      findMembership: jest.fn().mockResolvedValue({ role: "owner" }),
    } as unknown as jest.Mocked<GroupsRepository>;
    const handler = new FindMembershipHandler(groups);

    const result = await handler.execute(new FindMembershipQuery("g1", "u1"));

    expect(groups.findMembership).toHaveBeenCalledWith("g1", "u1");
    expect(result).toEqual({ role: "owner" });
  });
});
