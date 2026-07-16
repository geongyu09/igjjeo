import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NATIVE_SHELL_UA_TOKEN, useIsNativeShell } from ".";

function mockUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

describe("useIsNativeShell", () => {
  afterEach(() => {
    // own property로 덮어쓴 userAgent를 지워 jsdom 기본 getter를 복원한다.
    Reflect.deleteProperty(window.navigator, "userAgent");
  });

  it("일반 브라우저 UA에서는 false를 반환한다", () => {
    const { result } = renderHook(() => useIsNativeShell());
    expect(result.current).toBe(false);
  });

  it("UA에 네이티브 셸 토큰이 있으면 true를 반환한다", () => {
    mockUserAgent(`Mozilla/5.0 (iPhone) Mobile ${NATIVE_SHELL_UA_TOKEN}/1.0`);
    const { result } = renderHook(() => useIsNativeShell());
    expect(result.current).toBe(true);
  });
});
