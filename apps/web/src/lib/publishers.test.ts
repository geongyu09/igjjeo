import { describe, expect, it } from "vitest";
import { MVP_OUTLETS, OUTLET_KEYS, PUBLISHERS } from "./publishers";

describe("publishers", () => {
  it("다섯 언론사를 정의한다", () => {
    expect(OUTLET_KEYS).toEqual(["daily", "shock", "economy", "science", "emotion"]);
  });

  it("outlet_key로 언론사 이름을 찾을 수 있다", () => {
    expect(PUBLISHERS.daily.name).toBe("소모임일보");
    expect(PUBLISHERS.shock.name).toBe("데일리쇼크");
    expect(PUBLISHERS.economy.name).toBe("스터디경제");
    expect(PUBLISHERS.science.name).toBe("모임과학");
    expect(PUBLISHERS.emotion.name).toBe("주간감성");
  });

  it("MVP 언론사는 소모임일보·데일리쇼크·스터디경제 세 곳이다", () => {
    expect(MVP_OUTLETS).toEqual(["daily", "shock", "economy"]);
  });
});
