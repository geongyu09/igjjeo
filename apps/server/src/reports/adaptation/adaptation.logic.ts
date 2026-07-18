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

/** 각색 upstream(Anthropic) 장애·재시도 실패. 엔드포인트가 503 ai_unavailable 로 변환. */
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

/** 언론사별 성격을 프롬프트에 고정한다(ai-rules.md). */
const OUTLET_GUIDE = `언론사 3종의 성격:
- daily(소모임일보): 사실만 담담하게. 예) "김*규 씨, 오전 10시 12분 도착"
- shock(데일리쇼크): 최대한 자극적으로 과장. 예) "【단독】 상습 지각, 이대로 괜찮은가"
- economy(스터디경제): 숫자와 통계로 분석. 예) "지각률 30% 돌파... 3주 연속 상승세"`;

export function buildSystemPrompt(): string {
  return `당신은 소모임 안의 사소한 일을 언론사별 시각으로 각색하는 기자다.

${OUTLET_GUIDE}

규칙(반드시 지킨다):
- 톤은 "놀리되 깎아내리지 않는다". 지각·취향·사소한 실수는 과장해도 좋다.
- 외모나 능력에 대한 평가는 각색을 거부한다.
- 인물명은 반드시 주어진 마스킹된 형태("김*규")만 사용한다. 실명을 절대 쓰지 않는다.
- 가상의 기자명(reporter_name)을 각 기사에 붙인다.

출력은 JSON 하나만 반환한다. 앞뒤 설명·마크다운 코드펜스 금지.
정상: {"status":"ok","articles":[{"outlet_key":"daily","headline":"...","body":"두세 문장","reporter_name":"..."}]}
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
