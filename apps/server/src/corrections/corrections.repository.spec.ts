import type { SupabaseService } from "@/infra/supabase/supabase.service";

import { CorrectionsRepository } from "./corrections.repository";

function makeSupabase(result: {
  data?: unknown;
  count?: unknown;
  error: unknown;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    insert: jest.fn(() => builder),
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    single: jest.fn().mockResolvedValue(result),
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

describe("CorrectionsRepository", () => {
  it("requestDeletion 은 request_deletion RPC 를 호출한다", async () => {
    const { rpc, service } = makeSupabase({
      data: { article_id: "a1", is_active: false },
      error: null,
    });
    const repo = new CorrectionsRepository(service);

    const result = await repo.requestDeletion("a1", "u1");

    expect(rpc).toHaveBeenCalledWith("request_deletion", {
      p_article_id: "a1",
      p_requested_by: "u1",
    });
    expect(result).toEqual({ article_id: "a1", is_active: false });
  });

  it("createCorrectionRequest 는 요청을 넣고 id 를 반환한다", async () => {
    const { from, builder, service } = makeSupabase({
      data: { id: "cr1" },
      error: null,
    });
    const repo = new CorrectionsRepository(service);

    const result = await repo.createCorrectionRequest({
      articleId: "a1",
      userId: "u1",
      isSubject: true,
      correctionText: "정정",
    });

    expect(from).toHaveBeenCalledWith("correction_requests");
    expect(builder.insert).toHaveBeenCalledWith({
      article_id: "a1",
      requested_by: "u1",
      is_subject: true,
      correction_text: "정정",
    });
    expect(result).toBe("cr1");
  });

  it("insertSubjectCorrection 은 insert_subject_correction RPC 결과 첫 행을 반환한다", async () => {
    const row = { id: "a2", report_id: "r1" };
    const { rpc, service } = makeSupabase({ data: [row], error: null });
    const repo = new CorrectionsRepository(service);

    const result = await repo.insertSubjectCorrection({
      reportId: "r1",
      groupId: "g1",
      outletKey: "shock",
      headline: "H",
      body: "B",
      reporterName: "R",
      correctsArticleId: "a1",
    });

    expect(rpc).toHaveBeenCalledWith("insert_subject_correction", {
      p_report_id: "r1",
      p_group_id: "g1",
      p_outlet_key: "shock",
      p_headline: "H",
      p_body: "B",
      p_reporter_name: "R",
      p_corrects_article_id: "a1",
    });
    expect(result).toEqual(row);
  });

  it("publishThirdPartyCorrection 은 publish_third_party_correction RPC 를 호출한다", async () => {
    const rows = [{ id: "a3", report_id: "r2" }];
    const { rpc, service } = makeSupabase({ data: rows, error: null });
    const repo = new CorrectionsRepository(service);

    const drafts = [
      {
        outlet_key: "daily" as const,
        headline: "H",
        body: "B",
        reporter_name: "R",
      },
    ];
    const result = await repo.publishThirdPartyCorrection({
      groupId: "g1",
      reporterId: "u1",
      parentArticleId: "a1",
      rawText: "정정",
      articles: drafts,
    });

    expect(rpc).toHaveBeenCalledWith("publish_third_party_correction", {
      p_group_id: "g1",
      p_reporter_id: "u1",
      p_parent_article_id: "a1",
      p_raw_text: "정정",
      p_articles: drafts,
    });
    expect(result).toEqual(rows);
  });

  describe("countCorrectionRequestsToday", () => {
    it("본인·오늘 이후 correction_requests 행을 센다", async () => {
      const { from, builder, service } = makeSupabase({
        count: 2,
        error: null,
      });
      const repo = new CorrectionsRepository(service);

      const result = await repo.countCorrectionRequestsToday(
        "u1",
        "2026-07-17T15:00:00.000Z",
      );

      expect(from).toHaveBeenCalledWith("correction_requests");
      expect(builder.select).toHaveBeenCalledWith("id", {
        count: "exact",
        head: true,
      });
      expect(builder.eq).toHaveBeenCalledWith("requested_by", "u1");
      expect(builder.gte).toHaveBeenCalledWith(
        "created_at",
        "2026-07-17T15:00:00.000Z",
      );
      expect(result).toBe(2);
    });

    it("count 가 null 이면 0 을 반환한다", async () => {
      const { service } = makeSupabase({ count: null, error: null });
      const repo = new CorrectionsRepository(service);
      await expect(
        repo.countCorrectionRequestsToday("u1", "2026-07-17T15:00:00.000Z"),
      ).resolves.toBe(0);
    });
  });
});
