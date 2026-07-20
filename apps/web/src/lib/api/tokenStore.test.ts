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

  describe("subscribe", () => {
    it("set·clear 시 구독자에게 알린다", () => {
      let calls = 0;
      const unsubscribe = tokenStore.subscribe(() => {
        calls += 1;
      });

      tokenStore.set({ access_token: "a", refresh_token: "r" });
      expect(calls).toBe(1);

      tokenStore.clear();
      expect(calls).toBe(2);

      unsubscribe();
    });

    it("구독 해제 후에는 알리지 않는다", () => {
      let calls = 0;
      const unsubscribe = tokenStore.subscribe(() => {
        calls += 1;
      });
      unsubscribe();

      tokenStore.set({ access_token: "a", refresh_token: "r" });
      expect(calls).toBe(0);
    });
  });

  describe("revoke", () => {
    it("토큰을 비우고 폐기 상태로 표시한다", () => {
      tokenStore.set({ access_token: "a", refresh_token: "r" });
      expect(tokenStore.isRevoked()).toBe(false);

      tokenStore.revoke();

      expect(tokenStore.getAccessToken()).toBeNull();
      expect(tokenStore.getRefreshToken()).toBeNull();
      expect(tokenStore.isRevoked()).toBe(true);
    });

    it("구독자에게 알린다", () => {
      let calls = 0;
      const unsubscribe = tokenStore.subscribe(() => {
        calls += 1;
      });

      tokenStore.revoke();
      expect(calls).toBe(1);

      unsubscribe();
    });

    it("새 세션을 set 하면 폐기 상태가 풀린다", () => {
      tokenStore.revoke();
      tokenStore.set({ access_token: "a2", refresh_token: "r2" });

      expect(tokenStore.isRevoked()).toBe(false);
    });

    // 정상 로그아웃은 폐기(무효 토큰)와 다르다 — 재로그인 경로를 막지 않아야 한다.
    it("clear 는 폐기 상태로 표시하지 않는다", () => {
      tokenStore.set({ access_token: "a", refresh_token: "r" });
      tokenStore.clear();

      expect(tokenStore.isRevoked()).toBe(false);
    });
  });
});
