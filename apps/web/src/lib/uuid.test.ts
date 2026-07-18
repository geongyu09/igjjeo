import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "./uuid";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomUUID", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("v4 UUID 형식을 만든다", () => {
    expect(randomUUID()).toMatch(UUID_V4);
  });

  it("호출마다 다른 값을 만든다", () => {
    expect(randomUUID()).not.toBe(randomUUID());
  });

  it("crypto.randomUUID가 없어도(secure context 아님) v4 UUID를 만든다", () => {
    // 실기기 WebView의 http LAN IP 접속처럼 crypto.randomUUID가 없는 환경 재현.
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new TypeError("crypto.randomUUID is not a function");
    });

    const id = randomUUID();
    expect(id).toMatch(UUID_V4);
    expect(id).not.toBe(randomUUID());
  });
});
