import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { GroupsRepository } from "./groups.repository";

const groupRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "부트캠프 3조",
  invite_code: "AB12CD",
  role: "owner",
  member_count: 1,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeSupabase(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  };
  const from = jest.fn(() => builder);
  const rpc = jest.fn().mockResolvedValue(result);
  return {
    from,
    rpc,
    builder,
    service: { client: { from, rpc } } as unknown as SupabaseService,
  };
}

describe("GroupsRepository", () => {
  describe("createGroupWithOwner", () => {
    it("create_group_with_owner RPC 를 인자(키워드 포함)로 호출하고 첫 행을 반환한다", async () => {
      const { rpc, service } = makeSupabase({ data: [groupRow], error: null });
      const repo = new GroupsRepository(service);

      const result = await repo.createGroupWithOwner(
        "user-1",
        "부트캠프 3조",
        "지각 대장들",
      );

      expect(rpc).toHaveBeenCalledWith("create_group_with_owner", {
        p_user_id: "user-1",
        p_name: "부트캠프 3조",
        p_keyword: "지각 대장들",
      });
      expect(result).toEqual(groupRow);
    });

    it("키워드를 넘기지 않으면 p_keyword 는 null 로 호출한다", async () => {
      const { rpc, service } = makeSupabase({ data: [groupRow], error: null });
      const repo = new GroupsRepository(service);

      await repo.createGroupWithOwner("user-1", "부트캠프 3조");

      expect(rpc).toHaveBeenCalledWith("create_group_with_owner", {
        p_user_id: "user-1",
        p_name: "부트캠프 3조",
        p_keyword: null,
      });
    });

    it("RPC 에러가 오면 예외를 던진다", async () => {
      const { service } = makeSupabase({
        data: null,
        error: { message: "boom" },
      });
      const repo = new GroupsRepository(service);

      await expect(
        repo.createGroupWithOwner("user-1", "x"),
      ).rejects.toBeDefined();
    });

    it("반환 행이 없으면 예외를 던진다", async () => {
      const { service } = makeSupabase({ data: [], error: null });
      const repo = new GroupsRepository(service);

      await expect(repo.createGroupWithOwner("u", "x")).rejects.toBeDefined();
    });
  });

  describe("findMembership", () => {
    it("group_id·user_id 로 멤버십을 조회한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: { role: "member" },
        error: null,
      });
      const repo = new GroupsRepository(service);

      const result = await repo.findMembership("g1", "u1");

      expect(from).toHaveBeenCalledWith("group_members");
      expect(builder.eq).toHaveBeenCalledWith("group_id", "g1");
      expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
      expect(result).toEqual({ role: "member" });
    });

    it("멤버가 아니면 null 을 반환한다", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new GroupsRepository(service);

      await expect(repo.findMembership("g1", "u1")).resolves.toBeNull();
    });
  });

  describe("getSummary", () => {
    it("group_summaries 뷰에서 방 요약을 조회한다", async () => {
      const summary = {
        id: groupRow.id,
        name: groupRow.name,
        invite_code: groupRow.invite_code,
        created_by: "u1",
        created_at: groupRow.created_at,
        member_count: 3,
      };
      const { from, service } = makeSupabase({ data: summary, error: null });
      const repo = new GroupsRepository(service);

      const result = await repo.getSummary(groupRow.id);

      expect(from).toHaveBeenCalledWith("group_summaries");
      expect(result).toEqual(summary);
    });
  });

  describe("getKeyword", () => {
    it("groups 에서 keyword 를 조회한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: { keyword: "지각 대장들" },
        error: null,
      });
      const repo = new GroupsRepository(service);

      const result = await repo.getKeyword("g1");

      expect(from).toHaveBeenCalledWith("groups");
      expect(builder.select).toHaveBeenCalledWith("keyword");
      expect(builder.eq).toHaveBeenCalledWith("id", "g1");
      expect(result).toBe("지각 대장들");
    });

    it("행이 없으면 null 을 반환한다", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new GroupsRepository(service);

      await expect(repo.getKeyword("g1")).resolves.toBeNull();
    });
  });

  describe("listMyGroups", () => {
    it("list_my_groups RPC 를 limit·cursor 로 호출한다", async () => {
      const { rpc, service } = makeSupabase({ data: [], error: null });
      const repo = new GroupsRepository(service);

      await repo.listMyGroups("u1", 20, "2026-07-17T00:00:00.000Z");

      expect(rpc).toHaveBeenCalledWith("list_my_groups", {
        p_user_id: "u1",
        p_limit: 20,
        p_before: "2026-07-17T00:00:00.000Z",
      });
    });
  });

  describe("rotateInviteCode", () => {
    it("rotate_invite_code RPC 결과(새 코드)를 반환한다", async () => {
      const { rpc, service } = makeSupabase({ data: "ZZ99ZZ", error: null });
      const repo = new GroupsRepository(service);

      const code = await repo.rotateInviteCode("g1");

      expect(rpc).toHaveBeenCalledWith("rotate_invite_code", {
        p_group_id: "g1",
      });
      expect(code).toBe("ZZ99ZZ");
    });
  });

  describe("joinGroup", () => {
    it("join_group RPC 첫 행을 반환한다", async () => {
      const { rpc, service } = makeSupabase({ data: [groupRow], error: null });
      const repo = new GroupsRepository(service);

      const result = await repo.joinGroup("u1", "AB12CD");

      expect(rpc).toHaveBeenCalledWith("join_group", {
        p_user_id: "u1",
        p_invite_code: "AB12CD",
      });
      expect(result).toEqual(groupRow);
    });

    it("코드가 유효하지 않아 행이 없으면 null 을 반환한다", async () => {
      const { service } = makeSupabase({ data: [], error: null });
      const repo = new GroupsRepository(service);

      await expect(repo.joinGroup("u1", "NOPE")).resolves.toBeNull();
    });
  });

  describe("updateName", () => {
    it("groups.name 을 갱신한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: null,
        error: null,
      });
      const repo = new GroupsRepository(service);

      await repo.updateName("g1", "새 이름");

      expect(from).toHaveBeenCalledWith("groups");
      expect(builder.update).toHaveBeenCalledWith({ name: "새 이름" });
      expect(builder.eq).toHaveBeenCalledWith("id", "g1");
    });
  });

  describe("listMembers", () => {
    it("list_group_members RPC 결과를 반환한다", async () => {
      const members = [
        {
          user_id: "u1",
          display_name: "김건규",
          masked_name: "김*규",
          role: "owner",
          joined_at: "2026-07-17T00:00:00.000Z",
        },
      ];
      const { rpc, service } = makeSupabase({ data: members, error: null });
      const repo = new GroupsRepository(service);

      const result = await repo.listMembers("g1");

      expect(rpc).toHaveBeenCalledWith("list_group_members", {
        p_group_id: "g1",
      });
      expect(result).toEqual(members);
    });
  });

  describe("deleteMembership", () => {
    it("삭제된 행이 있으면 true", async () => {
      const { from, builder, service } = makeSupabase({
        data: [{ id: "m1" }],
        error: null,
      });
      const repo = new GroupsRepository(service);

      const result = await repo.deleteMembership("g1", "u1");

      expect(from).toHaveBeenCalledWith("group_members");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("group_id", "g1");
      expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
      expect(result).toBe(true);
    });

    it("삭제된 행이 없으면 false", async () => {
      const { service } = makeSupabase({ data: [], error: null });
      const repo = new GroupsRepository(service);

      await expect(repo.deleteMembership("g1", "u1")).resolves.toBe(false);
    });
  });
});
