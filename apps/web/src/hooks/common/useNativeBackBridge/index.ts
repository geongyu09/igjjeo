"use client";

import type {
  NativeToWebRequest,
  NativeToWebResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { useStackLinkBack } from "stack-link";

/**
 * 네이티브발 뒤로가기(안드로이드 하드웨어 백)를 웹 스택으로 위임하는 핸들러
 * (webview-architecture 네비게이션 플로우).
 *
 * 네이티브가 스크린을 직접 pop하면 웹 stack-link 스택의 여러 단계를 한 번에 건너뛴다.
 * 그래서 네이티브 back을 이 핸들러로 넘겨 뒤로가기의 단일 진실을 웹 스택으로 둔다.
 *
 * - 웹 스택이 남아 있으면(canGoBack) 웹에서 한 단계 되돌리고 `consumed: true`를 응답한다.
 * - 스택이 비었으면 `consumed: false`를 응답하고, 네이티브가 스크린을 pop해 탭으로 복귀한다.
 *
 * 반환 핸들러는 루트 레이아웃의 `<BridgeRequestListener onRequest=... />`에 연결한다.
 * (BridgeRequestListener.onRequest는 동기 전용 — geongyu-bridge 주의사항 1번.)
 */
export function useNativeBackBridge() {
  const { goBack, canGoBack } = useStackLinkBack();

  return useCallback(
    (message: NativeToWebRequest): NativeToWebResponse => {
      if (message.type === "back" && canGoBack) {
        goBack({ animation: "slide" });
        return { consumed: true };
      }
      return { consumed: false };
    },
    [goBack, canGoBack],
  );
}
