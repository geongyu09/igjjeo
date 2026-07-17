import { decodeCursor, encodeCursor } from "./cursor";

describe("cursor 코덱", () => {
  it("인코딩한 값을 디코딩하면 원래 값이 나온다", () => {
    const cursor = encodeCursor("2026-07-17T00:00:00.000Z");
    expect(decodeCursor(cursor)).toBe("2026-07-17T00:00:00.000Z");
  });

  it("원문 값을 그대로 노출하지 않는다(불투명)", () => {
    const value = "2026-07-17T00:00:00.000Z";
    expect(encodeCursor(value)).not.toBe(value);
  });

  it("빈/깨진 커서는 null 로 디코딩한다", () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("!!!not-base64!!!")).toBeNull();
  });
});
