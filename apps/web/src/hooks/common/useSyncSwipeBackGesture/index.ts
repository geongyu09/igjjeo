"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useEffect, useRef } from "react";
import { useStackLinkBack } from "stack-link";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";

/**
 * iOS 엣지 스와이프(스크린 전체 pop) 제스처의 활성화 여부를 네이티브에 동기화한다
 * (webview-architecture 네비게이션 플로우).
 *
 * 네이티브 제스처는 WebScreen을 통째로 pop하므로, 웹 stack-link 스택이 남아 있을 때 켜 두면
 * 여러 단계를 한 번에 건너뛴다. 그래서 스택이 비었을 때만(`enabled = !canGoBack`) 제스처를 켠다:
 * - 웹 루트(canGoBack=false): 제스처 on → 스와이프가 스크린을 pop해 탭으로 복귀.
 * - 웹 스택 있음(canGoBack=true): 제스처 off → 뒤로가기는 웹(useStackBack)이 담당.
 *
 * 네이티브 셸 밖(브라우저)에서는 no-op. 루트 레이아웃에서 한 번만 마운트한다.
 */
export function useSyncSwipeBackGesture() {
  const { canGoBack } = useStackLinkBack();
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();

  // useBridge 의 request 는 렌더마다 새 함수 identity 라, effect 의존성에 넣으면 canGoBack 이
  // 그대로여도 매 렌더 setSwipeBackEnabled 를 재전송한다. 최신 request 만 ref 로 참조하고
  // 실제 값이 바뀌는 canGoBack/isNativeShell 에만 의존시킨다.
  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current = request;
  });

  useEffect(() => {
    if (!isNativeShell) return;
    // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
    requestRef.current({
      requestMessage: {
        type: "setSwipeBackEnabled",
        payload: { enabled: !canGoBack },
      },
    });
  }, [canGoBack, isNativeShell]);
}
