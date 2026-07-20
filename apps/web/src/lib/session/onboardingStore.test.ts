import { beforeEach, describe, expect, it, vi } from "vitest";

import { onboardingStore } from "./onboardingStore";

describe("onboardingStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    onboardingStore.reset();
  });

  it("아직 완료하지 않았으면 false다", () => {
    expect(onboardingStore.get()).toBe(false);
  });

  it("markDone 하면 완료로 바뀐다", () => {
    onboardingStore.markDone();
    expect(onboardingStore.get()).toBe(true);
  });

  it("완료 여부를 localStorage에 남겨 다음 실행에서도 유지한다", () => {
    onboardingStore.markDone();
    onboardingStore.reset();
    expect(onboardingStore.get()).toBe(true);
  });

  it("clear 하면 다시 보지 않은 상태가 된다", () => {
    onboardingStore.markDone();
    onboardingStore.clear();
    expect(onboardingStore.get()).toBe(false);
    onboardingStore.reset();
    expect(onboardingStore.get()).toBe(false);
  });

  it("변경을 구독자에게 알린다", () => {
    const listener = vi.fn();
    onboardingStore.subscribe(listener);
    onboardingStore.markDone();
    expect(listener).toHaveBeenCalled();
  });

  it("이미 완료 상태면 다시 알리지 않는다", () => {
    onboardingStore.markDone();
    const listener = vi.fn();
    onboardingStore.subscribe(listener);
    onboardingStore.markDone();
    expect(listener).not.toHaveBeenCalled();
  });

  it("구독을 해제하면 더 이상 알리지 않는다", () => {
    const listener = vi.fn();
    const unsubscribe = onboardingStore.subscribe(listener);
    unsubscribe();
    onboardingStore.markDone();
    expect(listener).not.toHaveBeenCalled();
  });
});
