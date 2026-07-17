import { enableBridgeDebug } from "@geongyu/react-native-bridge/native";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { StackActions } from "@react-navigation/native";

import { navigationRef } from "../navigation/navigationRef";

// 개발 빌드에서만 브리지 Inspector를 켠다 — 방향(→송신/←수신)·kind·RTT·body와
// 무응답 요청(request:timeout, 기본 1000ms)을 콘솔에 찍는다. 웹 쪽 계측
// (apps/web/src/instrumentation-client.ts)과 짝을 이뤄, 웹의 pushScreen 요청이
// 네이티브 handleMessage까지 도달하는지·handshake(syn→syn-ack→ack)가 완료되는지를 본다.
// [디버그] 네이티브 로그 프리픽스 — Metro 콘솔에서 이 태그로 필터링.
export const logBridge = (...args: unknown[]) => {
  if (__DEV__) console.log("[bridge][native]", ...args);
};

if (__DEV__) {
  enableBridgeDebug();
  // 이 줄이 Metro에 안 뜨면 App 모듈이 새 코드로 리로드되지 않은 것.
  logBridge("🔧 enableBridgeDebug ON, __DEV__ =", __DEV__);
}

// 웹 → 네이티브 브리지 요청 처리 (탭 WebView·상세 WebScreen 공용, @geongyu/react-native-bridge).
// webview-architecture 네비게이션 플로우: 탭에서 상세 진입은 풀스크린 스크린 하나 push,
// 웹 스택이 비어 뒤로가면 그 스크린을 pop해 탭으로 복귀.
export function handleBridgeMessage(
  message: WebToNativeRequest,
): WebToNativeResponse {
  // [디버그] 요청이 여기까지 오면 handshake는 성공한 것 — 웹→네이티브 수신 확인.
  logBridge("⬅ onBridgeMessage:", JSON.stringify(message), {
    navReady: navigationRef.isReady(),
  });
  if (!navigationRef.isReady()) {
    logBridge("⚠ navigationRef 준비 안 됨 → success:false 반환(push 안 함)");
    return { success: false };
  }
  switch (message.type) {
    case "pushScreen":
      logBridge("→ WebScreen push:", message.payload.url);
      navigationRef.dispatch(
        StackActions.push("WebScreen", { url: message.payload.url }),
      );
      return { success: true };
    case "popScreen":
      if (navigationRef.canGoBack()) navigationRef.dispatch(StackActions.pop());
      return { success: true };
    default:
      return { success: false };
  }
}
