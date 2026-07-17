import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { tokenStore } from "./tokenStore";

describe("tokenStore", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.clear();
  });
  afterEach(() => {
    localStorage.clear();
    tokenStore.clear();
  });

  it("초기 상태에서는 토큰이 null", () => {
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });

  it("set 후 access·refresh 토큰을 돌려준다", () => {
    tokenStore.set({ access_token: "a", refresh_token: "r" });
    expect(tokenStore.getAccessToken()).toBe("a");
    expect(tokenStore.getRefreshToken()).toBe("r");
  });

  it("set은 localStorage에 저장해 새 인스턴스에서도 복원된다", () => {
    tokenStore.set({ access_token: "a", refresh_token: "r" });
    // 메모리 캐시를 비워도 localStorage에서 다시 읽는다
    tokenStore.reset();
    expect(tokenStore.getAccessToken()).toBe("a");
    expect(tokenStore.getRefreshToken()).toBe("r");
  });

  it("clear는 메모리·localStorage 모두 비운다", () => {
    tokenStore.set({ access_token: "a", refresh_token: "r" });
    tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
    tokenStore.reset();
    expect(tokenStore.getAccessToken()).toBeNull();
  });
});
