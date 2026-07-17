import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { ReportsRepository } from "./reports.repository";

function makeSupabase(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    single: jest.fn().mockResolvedValue(result),
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

describe("ReportsRepository", () => {
  describe("createReport", () => {
    it("reports 에 draft 로 삽입하고 행을 반환한다", async () => {
      const row = {
        id: "r1",
        group_id: "g1",
        reporter_id: "u1",
        status: "draft",
        draft_articles: null,
        created_at: "2026-07-17T00:00:00.000Z",
      };
      const { from, builder, service } = makeSupabase({
        data: row,
        error: null,
      });
      const repo = new ReportsRepository(service);

      const result = await repo.createReport({
        groupId: "g1",
        reporterId: "u1",
        rawText: "원문",
        photoUrl: null,
      });

      expect(from).toHaveBeenCalledWith("reports");
      expect(builder.insert).toHaveBeenCalledWith({
        group_id: "g1",
        reporter_id: "u1",
        raw_text: "원문",
        photo_url: null,
      });
      expect(result).toEqual(row);
    });
  });

  describe("getReport", () => {
    it("id 로 제보를 조회한다", async () => {
      const row = {
        id: "r1",
        group_id: "g1",
        reporter_id: "u1",
        status: "draft",
      };
      const { from, builder, service } = makeSupabase({
        data: row,
        error: null,
      });
      const repo = new ReportsRepository(service);

      const result = await repo.getReport("r1");

      expect(from).toHaveBeenCalledWith("reports");
      expect(builder.eq).toHaveBeenCalledWith("id", "r1");
      expect(result).toEqual(row);
    });

    it("없으면 null", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new ReportsRepository(service);
      await expect(repo.getReport("x")).resolves.toBeNull();
    });
  });

  describe("saveDraft", () => {
    it("draft_articles 와 draft_generated_at 을 갱신한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: null,
        error: null,
      });
      const repo = new ReportsRepository(service);

      const drafts = [
        {
          outlet_key: "daily" as const,
          headline: "H",
          body: "B",
          reporter_name: "R",
        },
      ];
      await repo.saveDraft("r1", drafts);

      expect(from).toHaveBeenCalledWith("reports");
      const patch = builder.update.mock.calls[0][0] as {
        draft_articles: unknown;
        draft_generated_at: unknown;
      };
      expect(patch.draft_articles).toEqual(drafts);
      expect(patch.draft_generated_at).toEqual(expect.any(String));
      expect(builder.eq).toHaveBeenCalledWith("id", "r1");
    });
  });

  describe("publishReport", () => {
    it("publish_report RPC 를 호출하고 기사 배열을 반환한다", async () => {
      const articles = [{ id: "a1", outlet_key: "daily" }];
      const { rpc, service } = makeSupabase({ data: articles, error: null });
      const repo = new ReportsRepository(service);

      const result = await repo.publishReport("r1", ["daily"]);

      expect(rpc).toHaveBeenCalledWith("publish_report", {
        p_report_id: "r1",
        p_outlet_keys: ["daily"],
      });
      expect(result).toEqual(articles);
    });
  });
});
