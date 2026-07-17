import { WebviewWithBridge } from "@geongyu/react-native-bridge/native";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import type { Ref } from "react";
import { StyleSheet } from "react-native";
import type WebView from "react-native-webview";

import {
  handleBridgeMessage,
  logBridge,
} from "../../bridge/handleBridgeMessage";
import { NATIVE_SHELL_UA_TOKEN, WEB_BG, WEB_URL } from "../../config/env";

// 웹 라우트 하나를 렌더하는 WebView. 스크린 종류(탭·스택·모달)와 무관하게 공통이다.
// - bridgeRef: 네이티브→웹 요청(usePostMessageBridge)에 이 WebView를 연결한다.
//   WebScreen이 하드웨어 백을 웹으로 위임할 때 사용한다.
// - onBridgeMessage: 웹→네이티브 요청 처리기. 기본은 공용 handleBridgeMessage.
//   WebScreen처럼 스크린 고유 처리(제스처 동기화 등)가 필요하면 덮어쓴다.
export function WebPane({
  path,
  bridgeRef,
  onBridgeMessage = handleBridgeMessage,
}: {
  path: string;
  bridgeRef?: Ref<WebView>;
  onBridgeMessage?: (message: WebToNativeRequest) => WebToNativeResponse;
}) {
  return (
    <WebviewWithBridge<WebToNativeRequest, WebToNativeResponse>
      ref={bridgeRef}
      source={{ uri: `${WEB_URL}${path}` }}
      style={styles.webview}
      applicationNameForUserAgent={NATIVE_SHELL_UA_TOKEN}
      // iOS: 링크 롱프레스 시 뜨는 미리보기(peek) 비활성화
      allowsLinkPreview={false}
      // 스크롤 끝에서 탄력적으로 튕기는 오버스크롤 제거 (iOS bounces / Android overScrollMode)
      bounces={false}
      overScrollMode="never"
      // [디버그] iOS 16.4+/Android는 이걸 켜야 WebView가 Safari·Chrome 원격 인스펙터에
      // 잡힌다(isInspectable=true). dev에서만.
      webviewDebuggingEnabled={__DEV__}
      onBridgeMessage={onBridgeMessage}
      // [디버그] handshake(syn→syn-ack→ack)가 끝나면 호출 — 이게 안 뜨면 네이티브가
      // 웹 SYN을 못 받았거나 응답이 웹에 안 닿은 것.
      onReadyToMessage={() =>
        logBridge("✅ handshake 완료 (onReadyToMessage):", path)
      }
      // [디버그] WebView가 웹 페이지를 실제로 불러왔는지 — 로드 실패면 브리지 이전 문제.
      onLoadStart={(e) => logBridge("WebView onLoadStart:", e.nativeEvent.url)}
      onLoadEnd={(e) =>
        logBridge(
          "WebView onLoadEnd:",
          e.nativeEvent.url,
          "loading=",
          e.nativeEvent.loading,
        )
      }
      onError={(e) =>
        logBridge(
          "❌ WebView onError:",
          e.nativeEvent.code,
          e.nativeEvent.description,
          e.nativeEvent.url,
        )
      }
      onHttpError={(e) =>
        logBridge(
          "❌ WebView onHttpError:",
          e.nativeEvent.statusCode,
          e.nativeEvent.url,
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
