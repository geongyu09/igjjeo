import {
  AdaptationParseError,
  buildSystemPrompt,
  buildUserPrompt,
  enforceMasking,
  parseAdaptationResponse,
} from "./adaptation.logic";

describe("buildSystemPrompt", () => {
  it("언론사 5종 성격과 톤·마스킹·JSON 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("daily");
    expect(prompt).toContain("shock");
    expect(prompt).toContain("science");
    expect(prompt).toContain("emotion");
    expect(prompt).toContain("praise");
    expect(prompt).toContain("놀리되");
    expect(prompt).toContain("JSON");
  });

  it("모든 기사 본문을 3~5문장으로 짧게 쓰도록 제한한다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("3~5문장");
    // 길이 제한이 언론사별 구조·문단 지침보다 우선함을 명시한다.
    expect(prompt).toContain("우선");
  });

  it("소모임일보(daily)는 역피라미드 스트레이트 뉴스 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("스트레이트");
    expect(prompt).toContain("역피라미드");
    expect(prompt).toContain("육하원칙");
    expect(prompt).toContain("출처");
  });

  // 스터디경제(economy)는 5종 체제에서 잠시 내렸다 — 되살릴 때 이 테스트도 함께 복구할 것.
  // it("스터디경제(economy)는 데이터 저널리즘 규칙을 담는다", () => {
  //   const prompt = buildSystemPrompt();
  //   expect(prompt).toContain("데이터 저널리스트");
  //   expect(prompt).toContain("절대값과 상대값");
  //   expect(prompt).toContain("상관관계와 인과관계");
  //   expect(prompt).toContain("중앙값");
  //   expect(prompt).toContain("표본 크기");
  //   expect(prompt).toContain("추정치");
  //   expect(prompt).toContain("방법론");
  //   expect(prompt).not.toContain("시각화");
  // });

  it("데일리쇼크(shock)는 자극적 헤드라인 패턴·익명 관계자 멘트 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("익명 관계자");
    expect(prompt).toContain("알고 보니");
    expect(prompt).toContain("설마");
  });

  it("모임과학(science)은 연구 형식을 흉내 내되 말도 안 되는 원인을 밝혀내는 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("말도 안 되");
    expect(prompt).toContain("가설");
    expect(prompt).toContain("없는 연구");
    expect(prompt).toContain("가짜 수치");
    expect(prompt).toContain("농담이라는 신호");
  });

  it("모임과학(science)은 존재하지 않는 물질과 이론을 지어내게 한다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("세상에 없는 물질");
    expect(prompt).toContain("지어낸다");
  });

  it("모임과학(science)은 어려운 전문 용어 대신 쉬운 말을 쓰게 한다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("쉬운 단어");
    expect(prompt).not.toContain("양자역학");
    expect(prompt).not.toContain("유체역학");
    expect(prompt).not.toContain("상관계수");
  });

  it("모임과학(science)은 원인을 인물이 아닌 지어낸 물질·환경 탓으로 돌린다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("지어낸 물질·기운·환경");
  });

  it("주간감성(emotion)은 감각적 묘사·여백·여운으로 감정을 끌어내는 에세이 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("감성 에세이");
    expect(prompt).toContain("1인칭");
    expect(prompt).toContain("감각적 묘사");
    expect(prompt).toContain("여백");
    expect(prompt).toContain("여운");
    expect(prompt).toContain("보편적 감정");
    expect(prompt).toContain("자기계발식");
  });

  it("일간찬양(praise)은 최상급 남발·영웅 서사·점층 과장 규칙을 담는다", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("찬양");
    expect(prompt).toContain("최상급");
    expect(prompt).toContain("단점");
    expect(prompt).toContain("역경");
    expect(prompt).toContain("감탄을 금치 못했다");
    expect(prompt).toContain("문장마다");
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

  it("방 키워드가 있으면 프롬프트에 참고 맥락으로 넣는다", () => {
    const prompt = buildUserPrompt({
      rawText: "또 지각했다",
      outletKeys: ["daily"],
      subjects: [],
      isSelfReport: false,
      keyword: "지각 대장들",
    });
    expect(prompt).toContain("지각 대장들");
  });

  it("방 키워드가 없거나 공백뿐이면 키워드 줄을 넣지 않는다", () => {
    const withoutKeyword = buildUserPrompt({
      rawText: "또 지각했다",
      outletKeys: ["daily"],
      subjects: [],
      isSelfReport: false,
    });
    const blankKeyword = buildUserPrompt({
      rawText: "또 지각했다",
      outletKeys: ["daily"],
      subjects: [],
      isSelfReport: false,
      keyword: "   ",
    });
    expect(withoutKeyword).not.toContain("방 키워드");
    expect(blankKeyword).not.toContain("방 키워드");
  });
});

describe("parseAdaptationResponse", () => {
  const requested = ["daily", "shock"] as const;

  it("정상 JSON 배열을 파싱하고 요청한 outlet 만 남긴다", () => {
    const raw = JSON.stringify({
      status: "ok",
      articles: [
        {
          outlet_key: "daily",
          headline: "H1",
          body: "B1",
          reporter_name: "정확한",
        },
        {
          outlet_key: "shock",
          headline: "H2",
          body: "B2",
          reporter_name: "특종",
        },
        {
          outlet_key: "science",
          headline: "H3",
          body: "B3",
          reporter_name: "분석",
        },
      ],
    });

    const result = parseAdaptationResponse(raw, [...requested]);
    expect(result).toEqual({
      status: "ok",
      articles: [
        {
          outlet_key: "daily",
          headline: "H1",
          body: "B1",
          reporter_name: "정확한",
        },
        {
          outlet_key: "shock",
          headline: "H2",
          body: "B2",
          reporter_name: "특종",
        },
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
    expect(() =>
      parseAdaptationResponse("설명입니다...", [...requested]),
    ).toThrow(AdaptationParseError);
  });

  it("요청한 outlet 기사가 하나도 없으면 AdaptationParseError", () => {
    const raw = JSON.stringify({
      status: "ok",
      articles: [
        { outlet_key: "science", headline: "H", body: "B", reporter_name: "R" },
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
