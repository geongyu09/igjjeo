import { WebviewWithBridge } from "@geongyu/react-native-bridge/native";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import type { Ref } from "react";
import { StyleSheet } from "react-native";
import type WebView from "react-native-webview";

import { handleBridgeMessage } from "../../bridge/handleBridgeMessage";
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
  onBridgeMessage?: (
    message: WebToNativeRequest,
  ) => Promise<WebToNativeResponse>;
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
      // 웹뷰 자체 로딩 인디케이터(로딩 뷰) 비활성화 — 로딩 UI는 웹(Suspense)에 위임한다.
      // startInLoadingState=false로 초기 로드 시 로딩 뷰를 띄우지 않고,
      // reload 등으로 viewState가 LOADING이 되는 경우까지 renderLoading을 빈 요소로 덮어 막는다.
      startInLoadingState={false}
      renderLoading={() => <></>}
      onBridgeMessage={onBridgeMessage}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
