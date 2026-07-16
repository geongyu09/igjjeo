"use client";

import { useBridge } from "@geongyu/bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { useStackLinkRouter } from "stack-link";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";

/**
 * 탭 WebView에서 상세 화면으로 진입한다 (webview-architecture 네비게이션 플로우).
 *
 * - 네이티브 셸(앱 WebView) 안: @geongyu/bridge로 네이티브에 풀스크린 스크린 push를 요청한다
 *   (탭 바를 가리는 새 스크린 하나. 이후 전환은 그 스크린 안에서 stack-link).
 * - 브라우저 프로토타입: 네이티브가 없으므로 stack-link로 웹 내부 전환한다.
 *
 * 반환 함수는 이동할 웹 라우트 경로(예: `/article/1`)를 받는다.
 */
export function useOpenScreen() {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const { navigate } = useStackLinkRouter({});

  return useCallback(
    (href: string) => {
      if (isNativeShell) {
        // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
        request({
          requestMessage: { type: "pushScreen", payload: { url: href } },
        });
        return;
      }
      navigate({ href, animation: "slide" });
    },
    [isNativeShell, request, navigate],
  );
}
