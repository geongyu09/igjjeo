/**
 * 멱등성 헤더 헬퍼 (conventions.md §8).
 * 부수효과가 있는 POST는 클라이언트 생성 UUID를 `Idempotency-Key`로 보내 중복 실행을 막는다.
 * 같은 논리적 작업의 재시도에서 동일 키를 쓰려면 caller가 key를 넘긴다(미지정 시 매 호출 새로 생성).
 */

import { randomUUID } from "@/lib/uuid";

export function idempotencyHeaders(key?: string): Record<string, string> {
  return { "Idempotency-Key": key ?? randomUUID() };
}
