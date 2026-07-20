"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { useStackLinkRouter } from "stack-link";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";

/**
 * 첫 진입 온보딩을 끝낸다 — 설명 4장을 끝까지 봤거나 건너뛴 뒤 다음 화면으로 보낸다.
 *
 * - 네이티브 셸(앱 WebView): 온보딩은 로그인 전에 뜨는 화면이라, 완료 기록과 다음 화면(로그인)은
 *   네이티브가 소유한다. @geongyu/react-native-bridge로 finishOnboarding을 요청한다.
 * - 브라우저 프로토타입: 로그인 화면이 없으므로 방 허브(/group)로 이동한다.
 */
export function useFinishOnboarding() {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const { navigate } = useStackLinkRouter({});

  return useCallback(() => {
    if (isNativeShell) {
      // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
      request({ requestMessage: { type: "finishOnboarding" } });
      return;
    }
    navigate({ href: "/group", animation: "slide" });
  }, [isNativeShell, request, navigate]);
}
