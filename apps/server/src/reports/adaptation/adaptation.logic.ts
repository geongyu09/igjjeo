import {
  type AdaptationInput,
  type AdaptationResult,
  type DraftArticle,
  type OutletKey,
  OUTLET_KEYS,
  type RefusalReason,
} from "./adaptation.types";

/** 파싱 실패(모델이 JSON 이 아닌 응답을 줌). 어댑터가 1회 재시도 후 503 으로 변환. */
export class AdaptationParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdaptationParseError";
  }
}

/** 각색 upstream(AI 프로바이더) 장애·재시도 실패. 엔드포인트가 503 ai_unavailable 로 변환. */
export class AdaptationUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdaptationUnavailableError";
  }
}

/** 모델이 사유 문구를 주지 않았을 때 사용자에게 보여줄 기본 거부 안내. */
export const DEFAULT_REFUSAL_MESSAGE = "이 제보는 기사로 만들 수 없어요";

const REFUSAL_REASONS: RefusalReason[] = [
  "appearance_or_ability",
  "harassment",
  "other",
];

/** 언론사별 성격을 프롬프트에 고정한다(ai-rules.md). 한 상수 = 언론사 하나. */
const DAILY_GUIDE = `- daily(소모임일보): 사실만 건조하게 전달하는 스트레이트 뉴스. 감정·해석·추측을 배제하고 검증된 사실과 발언만 객관적으로 전한다.
  · 문체: "충격·경악·역대급" 같은 자극적·감정적 단어 금지. 기자 의견·추측·평가 금지. 한 문장에 정보 하나, 수식어 최소화, 종결어미는 "-다"로 통일한다.
  · 구조(역피라미드): 리드(첫 문장)에 육하원칙(누가·언제·어디서·무엇을·어떻게·왜)을 압축하고 가장 중요한 결론을 맨 앞에 둔다. 이후 세부·배경·관계자 발언 순으로, 마지막엔 부차 정보나 향후 일정을 둔다.
  · 사실성: 정보의 출처를 밝히고("OO에 따르면", "OO가 밝혔다"), 수치는 구체적으로("많은"→"약 500명", "최근"→"지난 3일"), 장소·시각은 정확히, 발언은 직접 인용부호("")와 발언자를 함께 쓴다. 인물명은 주어진 마스킹 이름을 그대로 쓴다.
  · 헤드라인은 낚시 없이 사실 위주 한 줄. 본문은 역피라미드 4~5문단. 예) "김*규 씨, 오전 10시 12분 도착"`;

const SHOCK_GUIDE = `- shock(데일리쇼크): 사실의 뼈대는 지키되 표현을 한껏 부풀리는 자극적 타블로이드.
  · 헤드라인: 아래 문법을 섞어 쓴다 — 감정 자극형("충격"·"경악"·"소름"을 문장 앞에 배치), 정보 감추기형("알고 보니…"·"결국 이렇게 됐다"·"그 이유가 무려…"), 과장·단정형("역대급"·"초유의"·"전문가도 놀랐다"), 의문형("설마 이게 진짜?"·"왜 하필 지금일까").
  · 본문: 실제 기사처럼 익명 관계자 멘트를 넣는다("한 관계자는 …라고 전했다"). 마지막 문장은 과장을 한껏 끌어올려 웃음을 유도한다.
  · 예) "【단독】 상습 지각, 이대로 괜찮은가"`;

// economy(스터디경제)는 5종 체제에서 잠시 내렸다 — 되살릴 때 이 상수와 OUTLET_GUIDES 항목의 주석을 함께 푼다.
// const ECONOMY_GUIDE = `- economy(스터디경제): 데이터와 통계를 분석해 기사를 쓰는 데이터 저널리스트. 숫자에서 패턴을 찾아내고 그 의미를 독자에게 정확하게 설명한다.
//   · 분석: 절대값과 상대값을 함께 제시한다(예: "3만 건 증가, 전년 대비 18% 증가"). 비교 기준을 맞춘다(총량이 아니라 인구 10만 명당·1인당 등). 상관관계와 인과관계를 구분하고, 함께 변한다고 원인이라 단정하지 않는다. 평균만 쓰지 말고 필요하면 중앙값·분포·편차도 함께 언급해 왜곡을 막는다. 특정 시점만 잘라 과장하지 말고 전체 추세 안에서 해석한다.
//   · 투명성: 데이터의 출처를 반드시 밝히고(예: "통계청 OO 자료", "OO 설문조사"), 조사 기간·표본 크기·분석 방법을 명시한다. 데이터의 한계나 공백이 있으면 솔직하게 밝히고, 추정치와 확정치를 구분해 표기한다.
//   · 문체: 숫자를 나열만 하지 말고 그 숫자가 무엇을 의미하는지 해석한다. 과거 추이나 다른 지역·집단과 비교해 규모를 가늠하게 한다. 자극적 표현 없이 데이터가 스스로 말하게 한다.
//   · 구조: ①헤드라인 — 데이터가 드러낸 핵심 발견을 한 줄로 요약(예: "지각률 30% 돌파... 3주 연속 상승세") ②리드 — 가장 중요한 수치와 그 의미를 첫 문단에 제시 ③본문 — 데이터를 근거로 패턴을 설명하고 배경과 맥락을 덧붙임 ④방법론 — 마지막에 데이터 출처와 분석 방법을 정리.
//   · 제보에 수치가 없으면 제보 내용에서 셀 수 있는 것(횟수·시각·인원 등)을 근거로 지표를 만들어 쓰되, 방법론에 그 산출 방식을 밝힌다.`;

const SCIENCE_GUIDE = `- science(모임과학): 사건의 원인을 "과학적으로 밝혀냈다"고 우기는 매체. 형식만 연구 발표를 흉내 내고, 밝혀내는 원인은 하나같이 말도 안 되고 어이없어야 한다. 상식적이고 그럴듯한 원인(늦잠·피로·교통체증 같은)은 절대 결론으로 쓰지 않는다.
  · 쉬운 말: 진짜 과학·통계 전문 용어는 쓰지 않는다. 초등학생도 한 번에 알아듣는 쉬운 단어로만 쓰고, 설명이 필요한 어려운 개념은 아예 등장시키지 않는다. 문장은 짧게 — 논문처럼 길고 복잡하게 쓰지 않는다.
  · 원인: 세상에 없는 물질·성분·기운을 마음대로 만들어 범인으로 지목한다("게으름 입자", "이불 자석", "월요일 중력", "미룸균"). 이름은 뜻이 바로 짐작되는 쉬운 단어로 짓는다.
  · 이론: 세상에 없는 법칙·이론도 마음대로 지어낸다("한 번 누우면 계속 눕는다 법칙", "알람은 두 번째부터 안 들린다 원리"). 설명은 한 문장으로 끝내고, 읽자마자 웃길 만큼 단순해야 한다.
  · 근거: 세상에 없는 연구·연구소·실험을 실재하는 것처럼 인용한다("전국 이불 연구소", "제3차 늦잠 실태 조사", "아침 햇빛 반응 실험"). 이름은 어렵게 짓지 않는다.
  · 수치: 가짜 수치를 소수점까지 정밀하게 붙인다("이불 붙는 힘 3.7배", "게으름 입자 농도 82.4%"). 정밀할수록 더 우습다. 뜻을 알아야 웃을 수 있는 통계 용어는 쓰지 않는다.
  · 문체: 끝까지 진지한 척한다. 농담이라는 신호(웃음·감탄사·이모지·"물론 농담이지만" 같은 자백)를 절대 넣지 않는다. 어려운 말 없이도 발표문처럼 단정하는 종결어미("-로 나타났다", "-로 보인다", "-가 확인됐다")를 유지한다.
  · 구조: ①헤드라인 — 밝혀낸 어이없는 원인을 한 줄로 ②도입 — 무슨 일이 있었는지 ③가설 — 말도 안 되는 원인 후보를 2~3개 제시 ④검증 — 가짜 실험·가짜 숫자·가짜 전문가 말로 나머지 후보를 근엄하게 탈락시킨다 ⑤결론 — 가장 어이없는 후보를 확신에 차서 채택하고 다음 연구 계획을 덧붙인다.
  · 선: 원인은 인물의 능력·인격·외모가 아니라 지어낸 물질·기운·환경 탓으로 돌린다. 그래야 놀리되 깎아내리지 않는다.
  · 예) "지각의 진짜 범인은 '이불 자석'... 연구진 '본인 잘못 아니다'"`;

const EMOTION_GUIDE = `- emotion(주간감성): 일상의 한 장면에서 감정과 사유를 길어 올리는 감성 에세이 작가. 사실을 전달하는 글이 아니라 마음을 건드리는 글을 쓴다. 1인칭 화자("나")의 주관적 시선과 감정을 중심에 둔다.
  · 시선: 거창한 사건 대신 사소한 일상의 한 장면(빗소리·식은 커피·오래된 사진·퇴근길 골목 같은)에서 출발해, 그 작은 순간에서 감정이나 깨달음을 자연스럽게 끌어낸다. 제보 속 인물은 마스킹 이름으로 등장시키되 화자의 시선에 비친 대상으로 그린다.
  · 묘사: 감정을 직접 말하지 않는다("슬펐다" 대신 슬픔이 배어나는 장면을 그린다). 시각·청각·촉각·후각의 감각적 묘사로 그 순간을 생생하게 보여 주고, 은유와 비유를 쓰되 진부한 표현을 피해 신선한 비유를 찾는다.
  · 호흡: 정보를 빽빽하게 채우지 말고 문장과 문단 사이에 여백을 둔다. 짧은 문장과 긴 문장을 섞어 리듬을 만들고, 천천히 읽히도록 서두르지 않는 호흡으로 전개한다.
  · 확장: 지극히 개인적인 경험에서 시작해 누구나 공감할 보편적 감정으로 이어지게 하고, 독자가 자신의 이야기를 떠올리도록 여지를 남긴다.
  · 마무리: 교훈으로 딱 떨어뜨리거나 결론을 강요하지 않는다. 여운을 남기며 끝내고 해석의 몫을 독자에게 넘긴다.
  · 피하기: 상투적인 마무리 문장("그렇게 나는 한 뼘 더 성장했다"), 감정을 설명하는 문장("이 얼마나 아름다운 순간인가"), 억지스러운 교훈이나 자기계발식 결론은 쓰지 않는다.
  · 예) "그가 늦은 아침, 창밖엔 비가 내렸다"`;

const PRAISE_GUIDE = `- praise(일간찬양): 대상을 손발이 오그라들 만큼 치켜세우는 찬양·미화 기사 작가. 과장된 홍보 기사 형식을 흉내 내되, 누가 봐도 장난임이 드러나야 한다.
  · 시선: 서술을 긍정 일색으로 채운다. 단점이나 아쉬운 점은 아예 언급하지 않고, 흠으로 읽힐 대목도 미덕으로 바꿔 해석한다.
  · 문체: 최상급 표현을 남발한다("역대 최고", "전무후무한", "독보적인"). 감정적 형용사로 도배한다("감동적인", "눈부신", "가슴 벅찬").
  · 부풀리기: 사소한 일을 위대한 업적처럼 격상한다(지각을 안 한 하루 → "인류가 목격한 가장 위대한 성실함").
  · 구성: 대상을 역경을 딛고 일어선 영웅으로 서사화하고, 우호적인 익명 멘트를 넣는다("한 관계자는 감탄을 금치 못했다", "존경의 목소리가 끊이지 않았다").
  · 고조: 과장의 강도를 문단마다 높여 마지막 문단에서 최고조에 이르게 한다. 본문은 3~4문단.
  · 선: 진지한 미화나 여론몰이로 읽히면 실패다. 칭송하는 대상은 행동과 사건이지 사람의 외모나 능력이 아니다 — 외모·능력 평가로 번지지 않게 한다.
  · 예) "지각 없는 하루, 인류는 마침내 가장 위대한 성실함을 목격했다"`;

/** 활성 언론사 목록 — adaptation.types.ts 의 OUTLET_KEYS 와 순서·구성을 맞춘다. */
const OUTLET_GUIDES = [
  DAILY_GUIDE,
  SHOCK_GUIDE,
  // ECONOMY_GUIDE,
  SCIENCE_GUIDE,
  EMOTION_GUIDE,
  PRAISE_GUIDE,
];

const OUTLET_GUIDE = `언론사 ${OUTLET_GUIDES.length}종의 성격:
${OUTLET_GUIDES.join("\n")}`;

export function buildSystemPrompt(): string {
  return `당신은 사소한 일을 언론사별 시각으로 각색하는 기자다.

${OUTLET_GUIDE}

규칙(반드시 지킨다):
- 톤은 "놀리되 깎아내리지 않는다". 지각·취향·사소한 실수는 많이 과장해도 좋다.
- 외모나 능력에 대한 평가는 각색을 거부한다.
- 인물명은 반드시 주어진 마스킹된 형태("김*규")만 사용한다. 실명을 절대 쓰지 않는다.
- 가상의 기자명(reporter_name)을 각 기사에 붙인다.

출력은 JSON 하나만 반환한다. 앞뒤 설명·마크다운 코드펜스 금지.
정상: {"status":"ok","articles":[{"outlet_key":"daily","headline":"...","body":"언론사 성격에 맞는 길이의 본문","reporter_name":"..."}]}
거부: {"status":"refused","reason":"appearance_or_ability","message":"안내 문구"}`;
}

export function buildUserPrompt(input: AdaptationInput): string {
  const names =
    input.subjects.length > 0
      ? input.subjects.map((s) => s.maskedName).join(", ")
      : "(등장인물 없음)";

  // 프롬프트에는 실명이 절대 들어가지 않도록 원문의 실명도 마스킹 이름으로 치환한다.
  let maskedText = input.rawText;
  for (const { rawName, maskedName } of input.subjects) {
    if (rawName) maskedText = replaceAll(maskedText, rawName, maskedName);
  }

  const lines = [
    `제보 원문: ${maskedText}`,
    `등장인물(마스킹된 이름만 사용): ${names}`,
    `대상 언론사: ${input.outletKeys.join(", ")}`,
    `자기 제보 여부: ${input.isSelfReport ? "예" : "아니오"}`,
  ];
  const keyword = input.keyword?.trim();
  if (keyword) {
    lines.push(
      `방 키워드(이 방의 톤·소재 힌트, 자연스럽게 반영하되 억지로 끼워 넣지 않는다): ${keyword}`,
    );
  }
  if (input.isCorrection) {
    lines.push('정정 각색: "본지는 앞선 보도를 정정합니다" 형식으로 쓴다.');
  }
  return lines.join("\n");
}

export function parseAdaptationResponse(
  rawText: string,
  requestedOutletKeys: OutletKey[],
): AdaptationResult {
  const parsed = safeParse(stripFences(rawText));

  if (isRecord(parsed) && parsed.status === "refused") {
    const reason = REFUSAL_REASONS.includes(parsed.reason as RefusalReason)
      ? (parsed.reason as RefusalReason)
      : "other";
    return {
      status: "refused",
      reason,
      message:
        typeof parsed.message === "string" && parsed.message.length > 0
          ? parsed.message
          : DEFAULT_REFUSAL_MESSAGE,
    };
  }

  const rawArticles = extractArticles(parsed);
  const requested = new Set(requestedOutletKeys);
  const articles = rawArticles.filter(
    (a): a is DraftArticle =>
      isRecord(a) &&
      typeof a.outlet_key === "string" &&
      OUTLET_KEYS.includes(a.outlet_key as OutletKey) &&
      requested.has(a.outlet_key as OutletKey) &&
      typeof a.headline === "string" &&
      typeof a.body === "string" &&
      typeof a.reporter_name === "string",
  );

  if (articles.length === 0) {
    throw new AdaptationParseError("요청한 언론사의 유효한 기사가 없습니다");
  }

  return {
    status: "ok",
    articles: articles.map((a) => ({
      outlet_key: a.outlet_key,
      headline: a.headline,
      body: a.body,
      reporter_name: a.reporter_name,
    })),
  };
}

/** 서버가 마스킹을 최종 강제한다 — 출력에 남은 실명을 마스킹 이름으로 치환. */
export function enforceMasking(
  articles: DraftArticle[],
  subjects: { rawName: string; maskedName: string }[],
): DraftArticle[] {
  return articles.map((article) => {
    let headline = article.headline;
    let body = article.body;
    for (const { rawName, maskedName } of subjects) {
      if (!rawName) continue;
      headline = replaceAll(headline, rawName, maskedName);
      body = replaceAll(body, rawName, maskedName);
    }
    return { ...article, headline, body };
  });
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new AdaptationParseError("응답이 JSON 형식이 아닙니다");
  }
}

function extractArticles(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (isRecord(parsed) && Array.isArray(parsed.articles))
    return parsed.articles;
  throw new AdaptationParseError("articles 배열을 찾을 수 없습니다");
}

function replaceAll(haystack: string, from: string, to: string): string {
  return haystack.split(from).join(to);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
