// 클라이언트 계측 진입점 (Next 16 file convention).
// 하이드레이션 직전 브라우저에서 1회 실행 — useBridge가 handshake SYN을 보내기 전에
// 브리지 Inspector를 켜서 첫 통신부터 관찰한다.
//
// @geongyu/react-native-bridge 0.2.0의 enableBridgeDebug: 방향(→송신/←수신)·kind·RTT·body를
// 콘솔에 찍고, 무응답 요청을 request:timeout(기본 1000ms)으로 감지한다.
// handshake 3단계(syn → syn-ack → ack)가 순서대로 찍히는지, pushScreen 요청이 응답 없이
// request:timeout으로 끝나는지로 네이티브 미수신/핸드셰이크 실패를 진단한다.
// 구독자가 없으면 계측 지점은 즉시 반환하므로 프로덕션 오버헤드는 0 — 그래도 dev로만 제한한다.
import { enableBridgeDebug } from "@geongyu/react-native-bridge/web";

if (process.env.NODE_ENV !== "production") {
  try {
    enableBridgeDebug();
    // [디버그] 웹→네이티브 채널(window.ReactNativeWebView)이 주입됐는지, UA에 네이티브 셸
    // 토큰이 붙었는지 확인. WebView JS 콘솔에서 본다. present=false면 네이티브가 SYN을
    // 절대 못 받는다(모든 request가 조용히 no-op). native-shell=false면 useOpenScreen이
    // 브리지 대신 stack-link로 빠진다.
    console.log(
      "[bridge][web] init — ReactNativeWebView present:",
      "ReactNativeWebView" in window,
      "| native-shell UA:",
      navigator.userAgent.includes("IgjjeoNativeShell"),
    );
  } catch {
    // 관찰 활성화 실패가 앱 통신을 막지 않도록 격리한다.
  }
}
