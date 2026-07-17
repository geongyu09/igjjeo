import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { ArticlesRepository } from "./articles.repository";

function makeSupabase(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn().mockResolvedValue(result),
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

describe("ArticlesRepository", () => {
  it("getArticleAccess 는 articles 를 id 로 조회한다", async () => {
    const row = { id: "a1", group_id: "g1", is_active: true };
    const { from, builder, service } = makeSupabase({ data: row, error: null });
    const repo = new ArticlesRepository(service);

    const result = await repo.getArticleAccess("a1");

    expect(from).toHaveBeenCalledWith("articles");
    expect(builder.eq).toHaveBeenCalledWith("id", "a1");
    expect(result).toEqual(row);
  });

  it("getFeed 는 list_group_feed RPC 를 호출한다", async () => {
    const rows = [{ report_id: "r1", bundle_at: "t", bundle: {} }];
    const { rpc, service } = makeSupabase({ data: rows, error: null });
    const repo = new ArticlesRepository(service);

    const result = await repo.getFeed("g1", "u1", 21, null);

    expect(rpc).toHaveBeenCalledWith("list_group_feed", {
      p_group_id: "g1",
      p_user_id: "u1",
      p_limit: 21,
      p_before: null,
    });
    expect(result).toEqual(rows);
  });

  it("getArticleDetail 은 get_article_detail RPC 를 호출한다", async () => {
    const { rpc, service } = makeSupabase({ data: { id: "a1" }, error: null });
    const repo = new ArticlesRepository(service);

    const result = await repo.getArticleDetail("a1", "u1");

    expect(rpc).toHaveBeenCalledWith("get_article_detail", {
      p_article_id: "a1",
      p_user_id: "u1",
    });
    expect(result).toEqual({ id: "a1" });
  });

  it("getCorrectionChain 은 article_correction_chain RPC 를 호출한다", async () => {
    const { rpc, service } = makeSupabase({ data: [], error: null });
    const repo = new ArticlesRepository(service);

    await repo.getCorrectionChain("a1");

    expect(rpc).toHaveBeenCalledWith("article_correction_chain", {
      p_article_id: "a1",
    });
  });
});
