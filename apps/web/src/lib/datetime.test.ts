import { describe, expect, it } from "vitest";
import { formatByline, formatClock, formatRelativeTime } from "./datetime";

const now = new Date("2026-07-17T12:00:00");

describe("formatRelativeTime", () => {
  it("1분 미만은 '방금'", () => {
    expect(formatRelativeTime("2026-07-17T11:59:30", now)).toBe("방금");
  });

  it("분/시간/일 단위로 내림한다", () => {
    expect(formatRelativeTime("2026-07-17T11:45:00", now)).toBe("15분");
    expect(formatRelativeTime("2026-07-17T10:00:00", now)).toBe("2시간");
    expect(formatRelativeTime("2026-07-15T12:00:00", now)).toBe("2일");
  });

  it("일주일 이상은 'M월 D일'", () => {
    expect(formatRelativeTime("2026-07-01T09:00:00", now)).toBe("7월 1일");
  });

  it("잘못된 값은 빈 문자열", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("");
  });
});

describe("formatClock", () => {
  it("오전/오후 12시간제로 시:분을 만든다", () => {
    expect(formatClock("2026-07-17T10:24:00")).toBe("오전 10:24");
    expect(formatClock("2026-07-17T13:05:00")).toBe("오후 1:05");
    expect(formatClock("2026-07-17T00:00:00")).toBe("오전 12:00");
    expect(formatClock("2026-07-17T12:00:00")).toBe("오후 12:00");
  });
});

describe("formatByline", () => {
  it("기자명·시각·제보자를 한 줄로 잇는다", () => {
    expect(formatByline("특종 기자", "2026-07-17T10:24:00", "김*규")).toBe(
      "특종 기자 · 오전 10:24 · 제보 김*규",
    );
  });
});
