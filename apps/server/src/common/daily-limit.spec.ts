import { HttpException, HttpStatus } from "@nestjs/common";

import {
  DAILY_CORRECTION_LIMIT,
  DAILY_REPORT_LIMIT,
  dailyLimitExceeded,
  startOfSeoulDay,
} from "./daily-limit";

describe("startOfSeoulDay", () => {
  it("KST 오전 시각이면 같은 날 자정(=전날 15:00 UTC)을 반환한다", () => {
    // 2026-07-18T00:30:00Z = KST 2026-07-18 09:30 → KST 하루 시작 2026-07-18 00:00 = 2026-07-17T15:00:00Z
    expect(startOfSeoulDay(new Date("2026-07-18T00:30:00.000Z"))).toBe(
      "2026-07-17T15:00:00.000Z",
    );
  });

  it("KST 자정 직전(23:59)이면 그날의 시작을 반환한다", () => {
    // 2026-07-17T14:59:00Z = KST 2026-07-17 23:59 → 시작 2026-07-16T15:00:00Z
    expect(startOfSeoulDay(new Date("2026-07-17T14:59:00.000Z"))).toBe(
      "2026-07-16T15:00:00.000Z",
    );
  });

  it("KST 자정 경계(00:00)를 정확히 잡는다", () => {
    // 2026-07-17T15:00:00Z = KST 2026-07-18 00:00 → 시작 자신
    expect(startOfSeoulDay(new Date("2026-07-17T15:00:00.000Z"))).toBe(
      "2026-07-17T15:00:00.000Z",
    );
  });
});

describe("dailyLimitExceeded", () => {
  it("제보 한도 초과는 429 rate_limited 봉투를 만든다", () => {
    const ex = dailyLimitExceeded("report_daily", DAILY_REPORT_LIMIT);

    expect(ex).toBeInstanceOf(HttpException);
    expect(ex.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(ex.getResponse()).toEqual({
      error: {
        code: "rate_limited",
        message: expect.stringContaining("제보"),
        details: { limit: 5, scope: "report_daily" },
      },
    });
  });

  it("정정 한도 초과는 correction_daily scope 를 담는다", () => {
    const ex = dailyLimitExceeded("correction_daily", DAILY_CORRECTION_LIMIT);

    expect(ex.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(ex.getResponse()).toMatchObject({
      error: {
        code: "rate_limited",
        details: { limit: 5, scope: "correction_daily" },
      },
    });
  });
});
