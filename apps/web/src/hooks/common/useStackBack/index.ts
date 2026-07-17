"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { useStackLinkBack } from "stack-link";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";

/**
 * 뒤로가기 핸들러 (webview-architecture 네비게이션 플로우).
 *
 * - 웹 stack-link 스택이 남아 있으면 한 단계 되돌린다.
 * - 스택이 비면(canGoBack=false):
 *   - 네이티브 셸 안: @geongyu/react-native-bridge로 네이티브 스크린 pop을 요청해 탭으로 복귀한다.
 *   - 브라우저 프로토타입: 되돌아갈 곳이 없으므로 no-op.
 */
export function useStackBack() {
  const { goBack, canGoBack } = useStackLinkBack();
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();

  return useCallback(() => {
    if (canGoBack) {
      goBack({ animation: "slide" });
      return;
    }
    if (isNativeShell) {
      // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
      request({ requestMessage: { type: "popScreen" } });
    }
  }, [canGoBack, goBack, isNativeShell, request]);
}
