import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { ReactionsRepository } from "./reactions.repository";

function makeSupabase(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    upsert: jest.fn().mockResolvedValue(result),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
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

describe("ReactionsRepository", () => {
  it("add 는 유니크 충돌을 무시하는 upsert 로 멱등하게 넣는다", async () => {
    const { from, builder, service } = makeSupabase({ data: null, error: null });
    const repo = new ReactionsRepository(service);

    await repo.add("a1", "u1", "really");

    expect(from).toHaveBeenCalledWith("reactions");
    expect(builder.upsert).toHaveBeenCalledWith(
      { article_id: "a1", user_id: "u1", reaction_type: "really" },
      { onConflict: "article_id,user_id,reaction_type", ignoreDuplicates: true },
    );
  });

  it("remove 는 (article, user, type) 로 삭제한다", async () => {
    const { from, builder, service } = makeSupabase({ data: null, error: null });
    const repo = new ReactionsRepository(service);

    await repo.remove("a1", "u1", "shock");

    expect(from).toHaveBeenCalledWith("reactions");
    expect(builder.eq).toHaveBeenCalledWith("article_id", "a1");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(builder.eq).toHaveBeenCalledWith("reaction_type", "shock");
  });

  it("getState 는 article_reaction_state RPC 를 호출한다", async () => {
    const { rpc, service } = makeSupabase({ data: { article_id: "a1" }, error: null });
    const repo = new ReactionsRepository(service);

    await repo.getState("a1", "u1");

    expect(rpc).toHaveBeenCalledWith("article_reaction_state", {
      p_article_id: "a1",
      p_user_id: "u1",
    });
  });
});
