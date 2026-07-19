"use client";

import type { NativeToWebResponse } from "@igjjeo/bridge-contract";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * 네이티브발 `focus`(다른 스크린이 pop돼 이 WebView가 다시 노출됨)를 받아 React Query 캐시를
 * 무효화하는 핸들러 (webview-architecture 네비게이션 플로우).
 *
 * 각 네이티브 스크린은 독립된 WebView(별도 React Query 캐시)다. 네이티브가 WebView를 덮어도
 * DOM `visibilitychange`/`focus`는 발생하지 않아, 다른 스크린에서 바뀐 서버 상태가 복귀한
 * 이 화면에 반영되지 않는다(게다가 staleTime 동안 캐시는 fresh로 간주된다). 복귀 신호를
 * 브리지로 받아 활성 쿼리를 강제로 다시 가져와 이 간극을 메운다.
 *
 * 반환 핸들러는 루트 레이아웃의 `<BridgeRequestListener onRequest=... />`에 연결한다.
 * (BridgeRequestListener.onRequest는 동기 전용 — geongyu-bridge 주의사항 1번. invalidate는
 * 응답을 기다릴 필요가 없으므로 fire-and-forget으로 던지고 바로 응답한다.)
 */
export function useNativeFocusRefetch() {
  const queryClient = useQueryClient();

  return useCallback((): NativeToWebResponse => {
    void queryClient.invalidateQueries();
    return { consumed: true };
  }, [queryClient]);
}
