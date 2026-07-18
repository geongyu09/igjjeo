import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeGroupStore } from "./activeGroupStore";

describe("activeGroupStore", () => {
  beforeEach(() => {
    localStorage.clear();
    activeGroupStore.clear();
  });
  afterEach(() => {
    localStorage.clear();
    activeGroupStore.clear();
  });

  it("초기 상태에서는 활성 방이 null", () => {
    expect(activeGroupStore.get()).toBeNull();
  });

  it("set 후 활성 방 id를 돌려준다", () => {
    activeGroupStore.set("g1");
    expect(activeGroupStore.get()).toBe("g1");
  });

  it("set은 localStorage에 저장해 새 인스턴스에서도 복원된다", () => {
    activeGroupStore.set("g1");
    // 메모리 캐시를 비워도 localStorage에서 다시 읽는다
    activeGroupStore.reset();
    expect(activeGroupStore.get()).toBe("g1");
  });

  it("clear는 메모리·localStorage 모두 비운다", () => {
    activeGroupStore.set("g1");
    activeGroupStore.clear();
    expect(activeGroupStore.get()).toBeNull();
    activeGroupStore.reset();
    expect(activeGroupStore.get()).toBeNull();
  });

  describe("subscribe", () => {
    it("set·clear 시 구독자에게 알린다", () => {
      let calls = 0;
      const unsubscribe = activeGroupStore.subscribe(() => {
        calls += 1;
      });

      activeGroupStore.set("g1");
      expect(calls).toBe(1);

      activeGroupStore.clear();
      expect(calls).toBe(2);

      unsubscribe();
    });

    it("구독 해제 후에는 알리지 않는다", () => {
      let calls = 0;
      const unsubscribe = activeGroupStore.subscribe(() => {
        calls += 1;
      });
      unsubscribe();

      activeGroupStore.set("g1");
      expect(calls).toBe(0);
    });
  });
});
