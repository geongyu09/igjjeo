"use client";

import { useSyncExternalStore } from "react";

/**
 * 네이티브 앱 WebView가 User-Agent에 덧붙이는 식별 토큰.
 * apps/mobile의 WebView `applicationNameForUserAgent` 값과 항상 같아야 한다.
 */
export const NATIVE_SHELL_UA_TOKEN = "IgjjeoNativeShell";

const subscribe = () => () => {};
const getSnapshot = () => navigator.userAgent.includes(NATIVE_SHELL_UA_TOKEN);
const getServerSnapshot = () => false;

/**
 * 네이티브 앱(Expo WebView 셸) 안에서 실행 중인지 여부.
 * 네이티브가 담당하는 UI(하단 탭 바 등)를 웹에서 중복 렌더하지 않을 때 사용한다.
 * SSR에서는 false로 렌더되고 hydration 직후 실제 값으로 갱신된다.
 */
export function useIsNativeShell(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
