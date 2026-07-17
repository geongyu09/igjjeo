import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { attachAuthHeader, getApiBaseUrl } from "./client";
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
