// Next.js 웹 화면을 감싸는 WebView 셸이 가리킬 대상 주소.
// 실기기·Android 에뮬레이터에서는 localhost가 앱 자신을 가리키므로
// EXPO_PUBLIC_WEB_URL에 개발 머신의 LAN IP(예: http://192.168.0.10:3000)를 지정할 것.
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";

// WebView User-Agent에 덧붙는 식별 토큰. apps/web의
// hooks/common/useIsNativeShell의 NATIVE_SHELL_UA_TOKEN과 항상 같아야 한다 —
// 웹은 이 토큰으로 앱 안임을 감지해 상세 진입을 stack-link 대신 브리지 push로 보낸다.
export const NATIVE_SHELL_UA_TOKEN = "IgjjeoNativeShell";

// 웹 페이지 배경(apps/web globals.css의 --bg light 값 oklch(0.984 0.002 264))과
// 같은 색. 두 곳에 쓴다 — (1) safe area(노치·홈 인디케이터) 여백, (2) WebView 자체
// 배경. WebView 기본 배경은 흰색이라 이 색을 주지 않으면 웹 콘텐츠가 그려지기 전
// 로딩 동안 흰 화면이 깜빡여 색이 끊긴다. 앱은 라이트 모드 고정(app.json).
export const WEB_BG = "#f9fafb";
