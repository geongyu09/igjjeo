import {
  AdaptationParseError,
  buildSystemPrompt,
  buildUserPrompt,
  enforceMasking,
  parseAdaptationResponse,
} from "./adaptation.logic";

describe("buildSystemPrompt", () => {
  it("언론사 3종 성격과 톤·마스킹·JSON 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("daily");
    expect(prompt).toContain("shock");
    expect(prompt).toContain("economy");
    expect(prompt).toContain("놀리되");
    expect(prompt).toContain("JSON");
  });
});

describe("buildUserPrompt", () => {
  it("원문과 마스킹 이름만 넣고 실명은 넣지 않는다", () => {
    const prompt = buildUserPrompt({
      rawText: "김건규가 또 지각했다",
      outletKeys: ["daily", "shock"],
      subjects: [{ rawName: "김건규", maskedName: "김*규" }],
      isSelfReport: false,
    });
    expect(prompt).toContain("김*규");
    expect(prompt).not.toContain("김건규");
    expect(prompt).toContain("daily");
  });
});

describe("parseAdaptationResponse", () => {
  const requested = ["daily", "shock"] as const;

  it("정상 JSON 배열을 파싱하고 요청한 outlet 만 남긴다", () => {
    const raw = JSON.stringify({
      status: "ok",
      articles: [
        { outlet_key: "daily", headline: "H1", body: "B1", reporter_name: "정확한" },
        { outlet_key: "shock", headline: "H2", body: "B2", reporter_name: "특종" },
        { outlet_key: "economy", headline: "H3", body: "B3", reporter_name: "분석" },
      ],
    });

    const result = parseAdaptationResponse(raw, [...requested]);
    expect(result).toEqual({
      status: "ok",
      articles: [
        { outlet_key: "daily", headline: "H1", body: "B1", reporter_name: "정확한" },
        { outlet_key: "shock", headline: "H2", body: "B2", reporter_name: "특종" },
      ],
    });
  });

  it("코드펜스로 감싼 JSON 도 파싱한다", () => {
    const raw =
      '```json\n{"status":"ok","articles":[{"outlet_key":"daily","headline":"H","body":"B","reporter_name":"R"}]}\n```';
    const result = parseAdaptationResponse(raw, ["daily"]);
    expect(result.status).toBe("ok");
  });

  it("거부 응답을 파싱한다", () => {
    const raw = JSON.stringify({
      status: "refused",
      reason: "appearance_or_ability",
      message: "외모 평가는 기사로 만들 수 없어요",
    });
    const result = parseAdaptationResponse(raw, [...requested]);
    expect(result).toEqual({
      status: "refused",
      reason: "appearance_or_ability",
      message: "외모 평가는 기사로 만들 수 없어요",
    });
  });

  it("알 수 없는 거부 사유는 other 로 정규화한다", () => {
    const raw = JSON.stringify({
      status: "refused",
      reason: "made_up",
      message: "안 돼요",
    });
    const result = parseAdaptationResponse(raw, [...requested]);
    expect(result).toEqual({
      status: "refused",
      reason: "other",
      message: "안 돼요",
    });
  });

  it("JSON 이 아니면 AdaptationParseError", () => {
    expect(() => parseAdaptationResponse("설명입니다...", [...requested])).toThrow(
      AdaptationParseError,
    );
  });

  it("요청한 outlet 기사가 하나도 없으면 AdaptationParseError", () => {
    const raw = JSON.stringify({
      status: "ok",
      articles: [
        { outlet_key: "economy", headline: "H", body: "B", reporter_name: "R" },
      ],
    });
    expect(() => parseAdaptationResponse(raw, ["daily"])).toThrow(
      AdaptationParseError,
    );
  });
});

describe("enforceMasking", () => {
  it("본문·헤드라인에 남은 실명을 마스킹 이름으로 치환한다", () => {
    const articles = [
      {
        outlet_key: "daily" as const,
        headline: "김건규 씨 지각",
        body: "오늘도 김건규가 늦었다",
        reporter_name: "정확한",
      },
    ];
    const masked = enforceMasking(articles, [
      { rawName: "김건규", maskedName: "김*규" },
    ]);
    expect(masked[0].headline).toBe("김*규 씨 지각");
    expect(masked[0].body).toBe("오늘도 김*규가 늦었다");
    expect(JSON.stringify(masked)).not.toContain("김건규");
  });
});
