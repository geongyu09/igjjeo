import { HttpException, HttpStatus } from "@nestjs/common";

/** 사용자당 하루 제보 상한(product.md "하루 제보·정정 한도"). */
export const DAILY_REPORT_LIMIT = 5;
/** 사용자당 하루 정정 요청 상한(당사자·제3자 합산). */
export const DAILY_CORRECTION_LIMIT = 5;

export type DailyLimitScope = "report_daily" | "correction_daily";

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000; // KST = UTC+9, DST 없음

/**
 * 주어진 시각이 속한 KST(Asia/Seoul) 하루의 시작(자정)을 UTC ISO 문자열로 반환한다.
 * 일간 한도 카운트의 하한(`created_at >= 반환값`)으로 쓴다.
 */
export function startOfSeoulDay(now: Date): string {
  const shifted = new Date(now.getTime() + SEOUL_OFFSET_MS);
  const midnightUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(midnightUtcMs - SEOUL_OFFSET_MS).toISOString();
}

/**
 * 일간 한도 초과를 conventions.md §5/§7 표준 봉투의 `429 rate_limited` 로 만든다.
 * AllExceptionsFilter 가 이 봉투를 그대로 통과시킨다.
 */
export function dailyLimitExceeded(
  scope: DailyLimitScope,
  limit: number,
): HttpException {
  const kind = scope === "report_daily" ? "제보" : "정정";
  return new HttpException(
    {
      error: {
        code: "rate_limited",
        message: `하루 ${kind} 한도(${limit}회)를 모두 사용했어요`,
        details: { limit, scope },
      },
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}
