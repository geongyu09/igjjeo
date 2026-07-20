import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { apiClient, attachAuthHeader, getApiBaseUrl } from "./client";
import { tokenStore } from "./tokenStore";

function makeConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

describe("attachAuthHeader", () => {
  afterEach(() => {
    localStorage.clear();
    tokenStore.clear();
  });

  it("액세스 토큰이 있으면 Authorization 헤더를 붙인다", () => {
    tokenStore.set({ access_token: "tok", refresh_token: "r" });
    const config = attachAuthHeader(makeConfig());
    expect(config.headers.get("Authorization")).toBe("Bearer tok");
  });

  it("액세스 토큰이 없으면 Authorization 헤더를 붙이지 않는다", () => {
    const config = attachAuthHeader(makeConfig());
    expect(config.headers.get("Authorization")).toBeUndefined();
  });
});

describe("getApiBaseUrl", () => {
  it("/v1 하위 베이스 URL을 반환한다", () => {
    expect(getApiBaseUrl()).toMatch(/\/v1$/);
  });
});

describe("apiClient 타임아웃", () => {
  // 타임아웃이 없으면 닿지 않는 호스트(잘못된 LAN IP 등)에서 OS TCP 타임아웃까지
  // 매달려 화면이 무한 로딩으로 보인다. 반드시 유한한 값이어야 한다.
  it("유한한 타임아웃이 설정되어 있다", () => {
    expect(apiClient.defaults.timeout).toBeGreaterThan(0);
    expect(apiClient.defaults.timeout).toBeLessThanOrEqual(15_000);
  });
});
