/**
 * AI 프로바이더의 유일한 봉합선. 각색 도메인은 이 계약만 알고,
 * Anthropic·Gemini 같은 벤더 개념(SDK 타입·stop_reason·finishReason·HTTP 형태)은
 * providers/ 안의 구현에만 존재한다.
 *
 * 프로바이더 교체 = providers/ 에 이 인터페이스 구현 하나를 추가하고
 * AI_PROVIDER 환경변수를 바꾸는 것. 도메인 코드는 건드리지 않는다.
 */

export interface ChatModelRequest {
  /** 역할·규칙을 고정하는 지시문(프로바이더마다 전달 위치가 달라 구현이 흡수한다). */
  system: string;
  /** 이번 요청의 입력. */
  user: string;
  maxTokens: number;
  /** true 면 JSON 만 출력하도록 요청한다(지원하는 프로바이더만 실제로 강제). */
  jsonOnly?: boolean;
}

/**
 * 종료 사유를 도메인 3종으로 정규화한다. 벤더별 값(stop_reason/finishReason)은
 * 구현에서 이 셋 중 하나로 매핑한다.
 * - complete: 정상 종료. 본문을 파싱하면 된다.
 * - refused: 프로바이더 안전 정책이 생성을 거부. 재시도해도 같으므로 도메인 거부로 변환.
 * - truncated: 출력 한도에서 잘림. 재시도해도 같으므로 장애로 변환.
 */
export type ChatModelStop = "complete" | "refused" | "truncated";

export interface ChatModelResponse {
  text: string;
  stop: ChatModelStop;
}

/** 프로바이더 호출 실패(네트워크·인증·5xx). 어댑터가 503 으로 변환한다. */
export class ChatModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatModelError";
  }
}

export interface ChatModelPort {
  complete(request: ChatModelRequest): Promise<ChatModelResponse>;
}

/** DI 토큰 — 각색 어댑터는 이 토큰으로 프로바이더 구현을 주입받는다. */
export const CHAT_MODEL_PORT = Symbol("CHAT_MODEL_PORT");
