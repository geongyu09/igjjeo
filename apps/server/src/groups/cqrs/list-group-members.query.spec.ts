import type { GroupsRepository } from "../groups.repository";
import {
  ListGroupMembersHandler,
  ListGroupMembersQuery,
} from "./list-group-members.query";

describe("ListGroupMembersHandler", () => {
  it("멤버의 실명·마스킹명만 추려 반환한다", async () => {
    const groups = {
      listMembers: jest.fn().mockResolvedValue([
        {
          user_id: "u9",
          display_name: "김건규",
          masked_name: "김*규",
          role: "member",
          joined_at: "2026-07-17T00:00:00.000Z",
        },
      ]),
    } as unknown as jest.Mocked<GroupsRepository>;
    const handler = new ListGroupMembersHandler(groups);

    const result = await handler.execute(new ListGroupMembersQuery("g1"));

    expect(groups.listMembers).toHaveBeenCalledWith("g1");
    expect(result).toEqual([{ display_name: "김건규", masked_name: "김*규" }]);
  });
});
