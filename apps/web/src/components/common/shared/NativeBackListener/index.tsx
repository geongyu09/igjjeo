"use client";

import { BridgeRequestListener } from "@geongyu/react-native-bridge/web";
import type {
  NativeToWebRequest,
  NativeToWebResponse,
} from "@igjjeo/bridge-contract";
import { isInStackFrame } from "stack-link";

import { useNativeBackBridge } from "@/hooks/common/useNativeBackBridge";
import { useSyncSwipeBackGesture } from "@/hooks/common/useSyncSwipeBackGesture";

/**
 * 네이티브 ↔ 웹 뒤로가기 배선을 담는 마운트 전용 컴포넌트 (DOM 없음).
 * 루트 레이아웃에 한 번만 둔다. 두 방향을 함께 처리한다:
 * - 안드로이드 하드웨어 백: 네이티브발 `back` 요청을 웹 스택으로 위임 (useNativeBackBridge).
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
  const onRequest = useNativeBackBridge();
  useSyncSwipeBackGesture();

  return (
    <BridgeRequestListener<NativeToWebRequest, NativeToWebResponse>
      onRequest={onRequest}
      requestValidator={(message) => message?.type !== undefined}
    />
  );
}
