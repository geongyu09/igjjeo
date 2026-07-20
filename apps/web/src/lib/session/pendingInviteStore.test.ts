import { beforeEach, describe, expect, it, vi } from "vitest";
import { pendingInviteStore } from "./pendingInviteStore";

beforeEach(() => {
  localStorage.clear();
  pendingInviteStore.reset();
});

describe("pendingInviteStore", () => {
  it("설정한 초대 코드를 정규화해 보관하고 읽는다", () => {
    pendingInviteStore.set(" b3qfns ");
    expect(pendingInviteStore.get()).toBe("B3QFNS");
  });

  it("유효하지 않은 코드는 저장하지 않는다", () => {
    pendingInviteStore.set("---");
    expect(pendingInviteStore.get()).toBeNull();
  });

  it("clear로 비운다", () => {
    pendingInviteStore.set("B3QFNS");
    pendingInviteStore.clear();
    expect(pendingInviteStore.get()).toBeNull();
  });

  it("localStorage에 영속되어 reset(재하이드레이트) 후에도 읽힌다", () => {
    pendingInviteStore.set("B3QFNS");
    pendingInviteStore.reset();
    expect(pendingInviteStore.get()).toBe("B3QFNS");
  });

  it("변경 시 구독자에게 알린다", () => {
    const listener = vi.fn();
    const unsubscribe = pendingInviteStore.subscribe(listener);
    pendingInviteStore.set("B3QFNS");
    expect(listener).toHaveBeenCalledTimes(1);
    pendingInviteStore.clear();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    pendingInviteStore.set("ZZ99");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
