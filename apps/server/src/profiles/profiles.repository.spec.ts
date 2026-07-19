import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { ProfilesRepository } from "./profiles.repository";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "김건규",
  masked_name: "김*규",
  avatar_url: null,
  onboarded: true,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeSupabase(result: { data: unknown; error: unknown }) {
  const builder: Record<string, jest.Mock> = {
    select: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };
  const from = jest.fn(() => builder);
  return {
    from,
    builder,
    service: { client: { from } } as unknown as SupabaseService,
  };
}

function makeRpcSupabase(result: { data: unknown; error: unknown }) {
  const rpc = jest.fn().mockResolvedValue(result);
  return {
    rpc,
    service: { client: { rpc } } as unknown as SupabaseService,
  };
}

describe("ProfilesRepository", () => {
  describe("findById", () => {
    it("profiles 를 id 로 조회해 행을 반환한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: row,
        error: null,
      });
      const repo = new ProfilesRepository(service);

      const result = await repo.findById(row.id);

      expect(from).toHaveBeenCalledWith("profiles");
      expect(builder.eq).toHaveBeenCalledWith("id", row.id);
      expect(result).toEqual(row);
    });

    it("행이 없으면 null 을 반환한다", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new ProfilesRepository(service);

      await expect(repo.findById("nope")).resolves.toBeNull();
    });

    it("에러가 오면 예외를 던진다", async () => {
      const { service } = makeSupabase({
        data: null,
        error: { message: "boom" },
      });
      const repo = new ProfilesRepository(service);

      await expect(repo.findById("x")).rejects.toBeDefined();
    });
  });

  describe("update", () => {
    it("주어진 필드만 갱신하고 갱신된 행을 반환한다", async () => {
      const updated = { ...row, display_name: "박건규", masked_name: "박*규" };
      const { from, builder, service } = makeSupabase({
        data: updated,
        error: null,
      });
      const repo = new ProfilesRepository(service);

      const result = await repo.update(row.id, {
        display_name: "박건규",
        masked_name: "박*규",
      });

      expect(from).toHaveBeenCalledWith("profiles");
      expect(builder.update).toHaveBeenCalledWith({
        display_name: "박건규",
        masked_name: "박*규",
      });
      expect(builder.eq).toHaveBeenCalledWith("id", row.id);
      expect(result).toEqual(updated);
    });

    it("에러가 오면 예외를 던진다", async () => {
      const { service } = makeSupabase({
        data: null,
        error: { message: "boom" },
      });
      const repo = new ProfilesRepository(service);

      await expect(
        repo.update("x", { avatar_url: "https://x/a.png" }),
      ).rejects.toBeDefined();
    });
  });

  describe("getMemberProfileSummary", () => {
    const summary = {
      stats: { reports: 2, reactions: 5, scoops: 1 },
      reports: [
        {
          id: "r1",
          outlet_key: "emotion",
          headline: "그날, 회의실엔 침묵만 흘렀다",
          reaction_count: 3,
        },
      ],
    };

    it("get_member_profile_summary RPC 를 방·사용자로 호출해 요약을 반환한다", async () => {
      const { rpc, service } = makeRpcSupabase({ data: summary, error: null });
      const repo = new ProfilesRepository(service);

      const result = await repo.getMemberProfileSummary("g1", row.id);

      expect(rpc).toHaveBeenCalledWith("get_member_profile_summary", {
        p_group_id: "g1",
        p_user_id: row.id,
      });
      expect(result).toEqual(summary);
    });

    it("에러가 오면 예외를 던진다", async () => {
      const { service } = makeRpcSupabase({
        data: null,
        error: { message: "boom" },
      });
      const repo = new ProfilesRepository(service);

      await expect(
        repo.getMemberProfileSummary("g1", row.id),
      ).rejects.toBeDefined();
    });
  });
});
