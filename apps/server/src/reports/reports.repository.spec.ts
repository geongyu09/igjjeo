import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { ReportsRepository } from "./reports.repository";

function makeSupabase(result: {
  data?: unknown;
  count?: unknown;
  error: unknown;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
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

  describe("countReportsToday", () => {
    it("본인·직접 제보(parent_article_id NULL)·오늘 이후 행을 센다", async () => {
      const { from, builder, service } = makeSupabase({
        count: 3,
        error: null,
      });
      const repo = new ReportsRepository(service);

      const result = await repo.countReportsToday(
        "u1",
        "2026-07-17T15:00:00.000Z",
      );

      expect(from).toHaveBeenCalledWith("reports");
      expect(builder.select).toHaveBeenCalledWith("id", {
        count: "exact",
        head: true,
      });
      expect(builder.eq).toHaveBeenCalledWith("reporter_id", "u1");
      expect(builder.is).toHaveBeenCalledWith("parent_article_id", null);
      expect(builder.gte).toHaveBeenCalledWith(
        "created_at",
        "2026-07-17T15:00:00.000Z",
      );
      expect(result).toBe(3);
    });

    it("count 가 null 이면 0 을 반환한다", async () => {
      const { service } = makeSupabase({ count: null, error: null });
      const repo = new ReportsRepository(service);
      await expect(
        repo.countReportsToday("u1", "2026-07-17T15:00:00.000Z"),
      ).resolves.toBe(0);
    });
  });

  describe("latestRefillAt", () => {
    it("기준 시각 이후의 가장 최근 충전 시각을 반환한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: { created_at: "2026-07-17T18:00:00.000Z" },
        error: null,
      });
      const repo = new ReportsRepository(service);

      const result = await repo.latestRefillAt(
        "u1",
        "2026-07-17T15:00:00.000Z",
      );

      expect(from).toHaveBeenCalledWith("report_quota_refills");
      expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
      expect(builder.gte).toHaveBeenCalledWith(
        "created_at",
        "2026-07-17T15:00:00.000Z",
      );
      expect(builder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(result).toBe("2026-07-17T18:00:00.000Z");
    });

    it("충전 기록이 없으면 null", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new ReportsRepository(service);
      await expect(
        repo.latestRefillAt("u1", "2026-07-17T15:00:00.000Z"),
      ).resolves.toBeNull();
    });
  });

  describe("insertRefill", () => {
    it("report_quota_refills 에 충전을 기록하고 시각을 반환한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: { created_at: "2026-07-17T18:00:00.000Z" },
        error: null,
      });
      const repo = new ReportsRepository(service);

      const result = await repo.insertRefill("u1");

      expect(from).toHaveBeenCalledWith("report_quota_refills");
      expect(builder.insert).toHaveBeenCalledWith({ user_id: "u1" });
      expect(result).toBe("2026-07-17T18:00:00.000Z");
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
