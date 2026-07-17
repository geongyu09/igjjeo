import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { CommentsRepository } from "./comments.repository";

function makeSupabase(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: jest.fn(() => builder),
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

describe("CommentsRepository", () => {
  it("list 는 list_article_comments RPC 를 호출한다", async () => {
    const rows = [{ id: "c1", masked_name: "이*아", body: "b", created_at: "t" }];
    const { rpc, service } = makeSupabase({ data: rows, error: null });
    const repo = new CommentsRepository(service);

    const result = await repo.list("a1", 21, null);

    expect(rpc).toHaveBeenCalledWith("list_article_comments", {
      p_article_id: "a1",
      p_limit: 21,
      p_after: null,
    });
    expect(result).toEqual(rows);
  });

  it("create 는 create_comment RPC 결과의 첫 행을 반환한다", async () => {
    const row = { id: "c1", masked_name: "이*아", body: "b", created_at: "t" };
    const { rpc, service } = makeSupabase({ data: [row], error: null });
    const repo = new CommentsRepository(service);

    const result = await repo.create("a1", "u1", "b");

    expect(rpc).toHaveBeenCalledWith("create_comment", {
      p_article_id: "a1",
      p_user_id: "u1",
      p_body: "b",
    });
    expect(result).toEqual(row);
  });

  it("getOwner 는 comments 를 id 로 조회한다", async () => {
    const row = { id: "c1", user_id: "u1", article_id: "a1" };
    const { from, builder, service } = makeSupabase({ data: row, error: null });
    const repo = new CommentsRepository(service);

    const result = await repo.getOwner("c1");

    expect(from).toHaveBeenCalledWith("comments");
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(result).toEqual(row);
  });

  it("delete 는 comments 를 id 로 삭제한다", async () => {
    const { from, builder, service } = makeSupabase({ data: null, error: null });
    const repo = new CommentsRepository(service);

    await repo.delete("c1");

    expect(from).toHaveBeenCalledWith("comments");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
  });
});
