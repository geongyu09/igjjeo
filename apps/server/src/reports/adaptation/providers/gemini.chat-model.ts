import {
  ChatModelError,
  type ChatModelPort,
  type ChatModelRequest,
  type ChatModelResponse,
  type ChatModelStop,
} from "../chat-model.port";

/**
 * 각색은 형식 작업이라 Flash 로 충분하다(품질 상향 시 gemini-3.1-pro).
 *
 * 모델명 주의: 목록 API(`GET /v1beta/models`)에 보이는 모델이라도 신규 계정에서는
 * 404("no longer available to new users")가 날 수 있다(예: gemini-2.5-flash).
 * 사용 가능한 모델은 아래로 확인한다.
 *   curl -H "x-goog-api-key: $GEMINI_API_KEY" \
 *     "https://generativelanguage.googleapis.com/v1beta/models" | grep '"name"'
 */
const DEFAULT_MODEL = "gemini-3.5-flash";
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * 사고(thinking) 토큰 예산. Gemini 3.x 는 사고 토큰을 maxOutputTokens 에서 차감하므로,
 * 끄지 않으면 본문이 나오기 전에 한도에 걸려 응답이 잘린다(truncated).
 * 각색은 정해진 JSON 틀을 채우는 형식 작업이라 사고가 필요 없어 기본 0(비활성)으로 둔다.
 */
const DEFAULT_THINKING_BUDGET = 0;

export interface GeminiChatModelOptions {
  apiKey: string;
  /** 비우면 DEFAULT_MODEL. 서버에서는 AI_MODEL 환경변수가 이 값으로 들어온다. */
  model?: string;
  /** 사고 토큰 예산. 0 이면 비활성(기본). 품질이 아쉬우면 512~1024 로 올려 본다. */
  thinkingBudget?: number;
  /** 테스트·프록시용 오버라이드. */
  baseUrl?: string;
}

/** 안전 정책·저작권으로 생성이 막힌 경우 — 재시도해도 결과가 같다. */
const REFUSAL_REASONS = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "RECITATION",
  "IMAGE_SAFETY",
]);

/** Gemini 응답 중 이 구현이 실제로 읽는 부분만. */
interface GeminiResponseBody {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/**
 * Gemini(Google) 구현. 공식 SDK 없이 REST 를 fetch 로 호출한다 —
 * 프로바이더 하나에 npm 의존성이 딸려 오지 않게 해 교체·제거 비용을 0 으로 유지한다.
 * Gemini 를 아는 유일한 파일이며, finishReason 등 벤더 개념은 여기서 끝난다.
 */
export class GeminiChatModel implements ChatModelPort {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly thinkingBudget: number;
  private readonly baseUrl: string;

  constructor(
    options: GeminiChatModelOptions,
    // 두 번째 인자는 테스트에서 fetch 를 갈아 끼우기 위한 지점. 운영에서는 생략한다.
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
    this.thinkingBudget = options.thinkingBudget ?? DEFAULT_THINKING_BUDGET;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  async complete(request: ChatModelRequest): Promise<ChatModelResponse> {
    const body = await this.post(request);

    // 프롬프트 자체가 차단되면 candidates 없이 blockReason 만 온다.
    if (body.promptFeedback?.blockReason) {
      return { text: "", stop: "refused" };
    }

    const candidate = body.candidates?.[0];
    if (!candidate) {
      throw new ChatModelError("Gemini 응답에 후보가 없습니다");
    }

    const text = (candidate.content?.parts ?? [])
      .map((part) => part.text)
      .filter((part): part is string => typeof part === "string")
      .join("");

    return { text, stop: this.normalizeStop(candidate.finishReason, text) };
  }

  private async post(request: ChatModelRequest): Promise<GeminiResponseBody> {
    // API 키는 URL 쿼리(?key=)가 아닌 헤더로 보낸다 — 프록시·액세스 로그에 남지 않게.
    const url = `${this.baseUrl}/models/${this.model}:generateContent`;

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system }] },
          contents: [{ role: "user", parts: [{ text: request.user }] }],
          generationConfig: {
            maxOutputTokens: request.maxTokens,
            // 사고 토큰이 출력 한도를 잡아먹지 않게 한다(위 DEFAULT_THINKING_BUDGET 주석 참고).
            thinkingConfig: { thinkingBudget: this.thinkingBudget },
            // Anthropic 과 달리 JSON 출력을 API 수준에서 강제할 수 있다.
            ...(request.jsonOnly
              ? { responseMimeType: "application/json" }
              : {}),
          },
        }),
      });
    } catch (err) {
      throw new ChatModelError(
        err instanceof Error ? err.message : "Gemini 호출 실패",
      );
    }

    const body = (await response
      .json()
      .catch(() => ({}))) as GeminiResponseBody;

    if (!response.ok) {
      throw new ChatModelError(
        this.redact(
          `Gemini 오류(${response.status}): ${body.error?.message ?? "알 수 없는 오류"}`,
        ),
      );
    }

    return body;
  }

  private normalizeStop(
    finishReason: string | undefined,
    text: string,
  ): ChatModelStop {
    if (finishReason === "MAX_TOKENS") return "truncated";
    if (finishReason && REFUSAL_REASONS.has(finishReason)) return "refused";
    if (finishReason === "STOP" || !finishReason) return "complete";
    // 문서화되지 않은 사유(OTHER 등) — 본문이 있으면 파싱을 시도하고, 없으면 거부로 본다.
    return text.length > 0 ? "complete" : "refused";
  }

  /** upstream 메시지가 키를 되비추더라도 로그·에러로 새지 않게 한다. */
  private redact(message: string): string {
    return this.apiKey ? message.split(this.apiKey).join("***") : message;
  }
}
