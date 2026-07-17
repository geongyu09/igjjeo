import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { StackActions } from "@react-navigation/native";

import { navigationRef } from "../navigation/navigationRef";

// 웹 → 네이티브 브리지 요청 처리 (탭 WebView·상세 WebScreen 공용, @geongyu/react-native-bridge).
// webview-architecture 네비게이션 플로우: 탭에서 상세 진입은 풀스크린 스크린 하나 push,
// 웹 스택이 비어 뒤로가면 그 스크린을 pop해 탭으로 복귀.
export function handleBridgeMessage(
  message: WebToNativeRequest,
): WebToNativeResponse {
  if (!navigationRef.isReady()) {
    return { success: false };
  }
  switch (message.type) {
    case "pushScreen":
      navigationRef.dispatch(
        StackActions.push("WebScreen", { url: message.payload.url }),
      );
      return { success: true };
    case "popScreen":
      if (navigationRef.canGoBack()) navigationRef.dispatch(StackActions.pop());
      return { success: true };
    case "enterApp":
      // 로그인 성공 → 스택을 Tabs로 교체(Login 스크린 제거). 이후 탭 WebView가
      // 공유 저장소의 토큰을 읽어 앱을 렌더한다.
      navigationRef.reset({ index: 0, routes: [{ name: "Tabs" }] });
      return { success: true };
    default:
      return { success: false };
  }
}
