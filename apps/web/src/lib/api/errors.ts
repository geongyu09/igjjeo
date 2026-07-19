/**
 * API 에러 정규화 — 백엔드 표준 에러 봉투(conventions.md §5)를 단일 ApiError 타입으로 변환한다.
 * 컴포넌트·훅은 axios 에러 형태에 의존하지 않고 이 ApiError만 다룬다.
 */

import { isAxiosError } from "axios";

/** conventions.md §5의 대표 code. 서버가 새 code를 보내도 깨지지 않게 string과 합집합. */
export type ApiErrorCode =
  | "validation_failed"
  | "unauthorized"
  | "token_expired"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "adaptation_refused"
  | "rate_limited"
  | "internal_error"
  | "ai_unavailable"
  | "network_error"
  | (string & {});

interface ApiErrorInit {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor({ status, code, message, details }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/**
 * 세션이 없거나 만료·무효라 재로그인이 필요한 인증 오류인지 판별한다.
 * 이 오류는 재시도로 풀리지 않으므로, 호출부는 재시도 대신 로그아웃·로그인 유도로 처리한다.
 */
export function isAuthError(value: unknown): boolean {
  return (
    isApiError(value) &&
    (value.code === "unauthorized" || value.code === "token_expired")
  );
}

/** HTTP status → 봉투가 없을 때 사용할 fallback code (conventions.md §5). */
function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "validation_failed";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "adaptation_refused";
    case 429:
      return "rate_limited";
    case 503:
      return "ai_unavailable";
    default:
      return "internal_error";
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

/** 알 수 없는 오류(axios 에러·ApiError·기타)를 ApiError로 정규화한다. */
export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    const { response } = error;

    // 응답 있음 → 표준 봉투 우선, 없으면 status로 유추
    if (response) {
      const envelope = response.data as ErrorEnvelope | undefined;
      const body = envelope?.error;
      return new ApiError({
        status: response.status,
        code: body?.code ?? codeForStatus(response.status),
        message: body?.message ?? error.message,
        details: body?.details,
      });
    }

    // 요청은 나갔으나 응답 없음 → 네트워크 오류
    return new ApiError({
      status: 0,
      code: "network_error",
      message: error.message || "네트워크 오류가 발생했습니다",
    });
  }

  return new ApiError({
    status: 0,
    code: "internal_error",
    message:
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
  });
}
