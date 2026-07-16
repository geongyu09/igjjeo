"use client";

import { useCallback } from "react";
import { useStackLinkBack } from "stack-link";

/**
 * 뒤로가기 핸들러 — stack-link 웹 스택을 한 단계 되돌린다.
 * 웹 스택이 비면(canGoBack=false) 원래는 @geongyu/bridge로 네이티브 스크린 pop을
 * 요청해야 하지만, 브리지 연동은 다음 단계 범위라 지금은 no-op으로 둔다.
 */
export function useStackBack() {
  const { goBack, canGoBack } = useStackLinkBack();

  return useCallback(() => {
    if (!canGoBack) {
      // TODO(bridge): useBridge().request()로 네이티브 스크린 pop 요청.
      return;
    }
    goBack({ animation: "slide" });
  }, [canGoBack, goBack]);
}
