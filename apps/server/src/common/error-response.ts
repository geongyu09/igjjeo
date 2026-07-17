import { HttpException, HttpStatus } from "@nestjs/common";

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const STATUS_TO_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "validation_failed",
  [HttpStatus.UNAUTHORIZED]: "unauthorized",
  [HttpStatus.FORBIDDEN]: "forbidden",
  [HttpStatus.NOT_FOUND]: "not_found",
  [HttpStatus.CONFLICT]: "conflict",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "adaptation_refused",
  [HttpStatus.TOO_MANY_REQUESTS]: "rate_limited",
  [HttpStatus.SERVICE_UNAVAILABLE]: "ai_unavailable",
};

/**
 * 임의의 예외를 conventions.md §5 표준 에러 봉투 `{ error: { code, message, details } }`
 * 로 정규화한다. 내부 오류(비-HttpException)는 메시지를 감춰 민감 정보 유출을 막는다.
 */
export function toErrorResponse(exception: unknown): {
  status: number;
  body: ErrorBody;
} {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // 도메인 계층이 이미 표준 봉투로 던진 경우 그대로 통과.
    if (isEnvelope(response)) {
      return { status, body: response };
    }

    const code = STATUS_TO_CODE[status] ?? "internal_error";

    // ValidationPipe: { statusCode, message: string[] | string, error }.
    if (isObject(response) && "message" in response) {
      const raw = (response as { message: unknown }).message;
      if (Array.isArray(raw)) {
        return {
          status,
          body: {
            error: {
              code,
              message: raw.join(", "),
              details: { messages: raw },
            },
          },
        };
      }
      return { status, body: { error: { code, message: String(raw) } } };
    }

    return { status, body: { error: { code, message: exception.message } } };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: {
      error: { code: "internal_error", message: "서버 오류가 발생했습니다" },
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEnvelope(value: unknown): value is ErrorBody {
  return (
    isObject(value) &&
    isObject(value.error) &&
    typeof (value.error as Record<string, unknown>).code === "string"
  );
}
