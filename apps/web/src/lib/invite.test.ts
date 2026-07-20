import { describe, expect, it } from "vitest";
import { buildInviteLink, normalizeInviteCode } from "./invite";

describe("normalizeInviteCode", () => {
  it("공백을 제거하고 대문자로 정규화한다", () => {
    expect(normalizeInviteCode(" b3qfns ")).toBe("B3QFNS");
  });

  it("영숫자가 아닌 문자를 제거한다", () => {
    expect(normalizeInviteCode("a1-b2 c3")).toBe("A1B2C3");
  });

  it("비어 있거나 유효 문자가 없으면 null을 반환한다", () => {
    expect(normalizeInviteCode("")).toBeNull();
    expect(normalizeInviteCode("   ")).toBeNull();
    expect(normalizeInviteCode("---")).toBeNull();
    expect(normalizeInviteCode(null)).toBeNull();
    expect(normalizeInviteCode(undefined)).toBeNull();
  });

  it("과도하게 긴 값은 초대 코드로 인정하지 않는다", () => {
    expect(normalizeInviteCode("A".repeat(17))).toBeNull();
  });
});

describe("buildInviteLink", () => {
  it("origin과 코드로 초대 링크를 만든다", () => {
    expect(buildInviteLink("https://igjjeo-web.vercel.app", "B3QFNS")).toBe(
      "https://igjjeo-web.vercel.app/?invite=B3QFNS",
    );
  });

  it("origin 끝의 슬래시를 중복하지 않는다", () => {
    expect(buildInviteLink("https://igjjeo-web.vercel.app/", "B3QFNS")).toBe(
      "https://igjjeo-web.vercel.app/?invite=B3QFNS",
    );
  });
});
