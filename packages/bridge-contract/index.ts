/**
 * 웹(WebView, apps/web) ↔ 네이티브(Expo, apps/mobile) 브리지 메시지 계약.
 *
 * 양쪽 워크스페이스는 반드시 이 타입만 사용해 요청/응답 쌍을 명시한다
 * (수제 브리지 금지 — .claude/rules/webview-architecture.md).
 * 통신 자체는 @geongyu/bridge를 경유한다:
 *   - 웹:    useBridge<WebToNativeRequest, WebToNativeResponse>()
 *   - 네이티브: <WebviewWithBridge<WebToNativeRequest, WebToNativeResponse> />
 *
 * 이 파일은 타입 전용이라 런타임 코드가 없다 — 번들 시 전부 제거된다.
 */

/**
 * 웹 → 네이티브 요청.
 * - `pushScreen`: 탭 WebView에서 상세로 진입할 때 네이티브 풀스크린 WebView 스크린 하나를 push.
 *   `payload.url`은 웹 라우트 경로(예: `/article/1`).
 * - `popScreen`: 웹 stack-link 스택이 비었을 때(canGoBack=false) 네이티브 스크린을 pop해 탭으로 복귀.
 */
export type WebToNativeRequest =
  | { type: "pushScreen"; payload: { url: string } }
  | { type: "popScreen"; payload?: never };

/** 웹 → 네이티브 응답. 항상 객체로 반환한다(@geongyu/bridge는 falsy 응답 시 콜백을 건너뜀). */
export type WebToNativeResponse = { success: boolean };
