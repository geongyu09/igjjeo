/**
 * 웹(WebView, apps/web) ↔ 네이티브(Expo, apps/mobile) 브리지 메시지 계약.
 *
 * 양쪽 워크스페이스는 반드시 이 타입만 사용해 요청/응답 쌍을 명시한다
 * (수제 브리지 금지 — .claude/rules/webview-architecture.md).
 * 통신 자체는 @geongyu/react-native-bridge를 경유한다:
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
 * - `setSwipeBackEnabled`: iOS 엣지 스와이프(스크린 전체 pop) 제스처의 활성화 여부를 동기화한다.
 *   네이티브 제스처는 스크린을 통째로 pop하므로 웹 스택이 남아 있을 때 켜 두면 여러 단계를 건너뛴다.
 *   따라서 웹은 스택이 비었을 때만(`enabled = !canGoBack`) 제스처를 켠다.
 */
export type WebToNativeRequest =
  | { type: "pushScreen"; payload: { url: string } }
  | { type: "popScreen"; payload?: never }
  | { type: "setSwipeBackEnabled"; payload: { enabled: boolean } };

/** 웹 → 네이티브 응답. 항상 객체로 반환한다(@geongyu/react-native-bridge는 falsy 응답 시 콜백을 건너뜀). */
export type WebToNativeResponse = { success: boolean };

/**
 * 네이티브 → 웹 요청.
 * - `back`: 네이티브 뒤로가기(안드로이드 하드웨어 백)를 웹 스택으로 위임한다.
 *   네이티브가 스크린을 직접 pop하면 웹 stack-link 스택의 여러 단계를 한 번에 건너뛰므로,
 *   back을 웹으로 넘겨 뒤로가기의 단일 진실을 웹 스택에 둔다.
 *   웹 스택이 남아 있으면 웹이 한 단계 되돌리고 `consumed: true`를 응답하며,
 *   비었으면 `consumed: false`를 응답해 네이티브가 스크린을 pop하도록 한다.
 */
export type NativeToWebRequest = { type: "back" };

/**
 * 네이티브 → 웹 응답. `consumed: true`면 웹이 뒤로가기를 처리했으니 네이티브는 pop하지 않는다.
 * 항상 객체로 반환한다(@geongyu/react-native-bridge는 falsy 응답 시 콜백을 건너뜀).
 */
export type NativeToWebResponse = { consumed: boolean };
