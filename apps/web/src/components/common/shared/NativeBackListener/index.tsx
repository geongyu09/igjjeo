"use client";

import { BridgeRequestListener } from "@geongyu/react-native-bridge/web";
import type {
  NativeToWebRequest,
  NativeToWebResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { isInStackFrame } from "stack-link";

import { useNativeBackBridge } from "@/hooks/common/useNativeBackBridge";
import { useNativeFocusRefetch } from "@/hooks/common/useNativeFocusRefetch";
import { useSyncSwipeBackGesture } from "@/hooks/common/useSyncSwipeBackGesture";

/**
 * 네이티브발 요청을 수신하는 마운트 전용 컴포넌트 (DOM 없음).
 * 루트 레이아웃에 한 번만 둔다. 세 가지를 함께 처리한다:
 * - 안드로이드 하드웨어 백(`back`): 웹 스택으로 위임 (useNativeBackBridge).
 * - 스크린 복귀(`focus`): 덮였다 다시 노출된 WebView의 React Query를 무효화 (useNativeFocusRefetch).
 * - iOS 엣지 스와이프: 웹 canGoBack에 따라 네이티브 제스처 on/off 동기화 (useSyncSwipeBackGesture).
 *
 * stack-link preLoad iframe 안에서는 브리지 handshake를 시작하면 안 되므로 isInStackFrame()으로
 * 가드한다 (webview-architecture 규칙 · geongyu-bridge 주의사항 7번).
 */
export function NativeBackListener() {
  if (isInStackFrame()) return null;
  return <TopFrameBridge />;
}

// 최상위 프레임에서만 마운트 — 여기서만 브리지 훅(handshake·요청)을 실행한다.
function TopFrameBridge() {
  const onBack = useNativeBackBridge();
  const onFocus = useNativeFocusRefetch();
  useSyncSwipeBackGesture();

  // 네이티브발 요청을 타입별로 분기한다. onRequest는 동기 전용(geongyu-bridge 주의사항 1번).
  const onRequest = useCallback(
    (message: NativeToWebRequest): NativeToWebResponse =>
      message.type === "focus" ? onFocus() : onBack(message),
    [onBack, onFocus],
  );

  return (
    <BridgeRequestListener<NativeToWebRequest, NativeToWebResponse>
      onRequest={onRequest}
      requestValidator={(message) => message?.type !== undefined}
    />
  );
}
