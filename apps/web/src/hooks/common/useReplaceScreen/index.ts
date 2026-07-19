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
 * 현재 화면을 다른 화면으로 교체한다 — 스택에 쌓지 않고 갈아끼운다
 * (webview-architecture 네비게이션 플로우). 방 안(Tabs)에서 방 허브(`/group`)로
 * 나갈 때처럼 뒤로 돌아갈 대상이 아니라 화면 자체를 바꿀 때 쓴다.
 *
 * - 네이티브 셸(앱 WebView) 안: @geongyu/react-native-bridge로 네이티브에 현재 스크린을
 *   풀스크린 스크린 하나로 교체(replace)하도록 요청한다.
 * - 브라우저 프로토타입: 네이티브가 없으므로 stack-link로 웹 내부 전환한다.
 *
 * 반환 함수는 이동할 웹 라우트 경로(예: `/group`)를 받는다.
 */
export function useReplaceScreen() {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const { navigate } = useStackLinkRouter({});

  return useCallback(
    (href: string) => {
      if (isNativeShell) {
        // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
        request({
          requestMessage: { type: "replaceScreen", payload: { url: href } },
        });
        return;
      }
      navigate({ href, animation: "slide" });
    },
    [isNativeShell, request, navigate],
  );
}
