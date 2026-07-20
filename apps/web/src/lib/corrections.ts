/**
 * 정정 요청 도메인 상수·타입 (ai-rules.md "정정 요청 처리 규칙").
 * DB·서버와 공유하는 값이므로 컴포넌트가 아니라 여기에 둔다.
 */

/** 정정 내용 길이 상한 — 서버 DTO의 `@MaxLength(500)`과 같은 값이어야 한다. */
export const CORRECTION_TEXT_MAX_LENGTH = 500;

export interface CorrectionRequestInput {
  /**
   * true=당사자 정정 — 같은 언론사가 "본지는 앞선 보도를 정정합니다" 기사 1건을 얹는다.
   * false=제3자 정정 — 새 제보로 취급돼 언론사 수만큼 기사가 나온다.
   * 어느 쪽도 원 기사를 내리지 않는다.
   */
  isSubject: boolean;
  correctionText: string;
}
