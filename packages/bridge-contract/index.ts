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
 * - `getSession`: 로그인은 네이티브(Google/Apple)가 담당하고 세션 토큰을 네이티브가 보관한다.
 *   탭 WebView(웹)는 마운트 시 이 요청으로 네이티브가 가진 세션 토큰을 받아 자신의 저장소에 넣는다.
 *   응답 `session` 에 토큰을 실어 준다(없으면 null). 로그인 자체가 네이티브 게이트라 보통 non-null.
 * - `clearSession`: 웹에서 로그아웃할 때, 네이티브가 보관한 세션까지 지우고 로그인 스크린으로 돌아가게 한다.
 * - `enterRoom`: 방 허브(웹 `/group`)에서 방을 골라 방 안으로 들어갈 때, 네이티브가 하단 탭 화면(Tabs)으로
 *   스택을 교체하도록 요청한다. 어떤 방인지(활성 방)는 웹이 소유하므로 네이티브는 `payload.groupId`를
 *   화면 전환 자체에만 참고한다 — 탭 WebView(피드)는 웹의 activeGroupStore에서 활성 방을 읽는다.
 */
export type WebToNativeRequest =
  | { type: "pushScreen"; payload: { url: string } }
  | { type: "popScreen"; payload?: never }
  | { type: "setSwipeBackEnabled"; payload: { enabled: boolean } }
  | { type: "getSession"; payload?: never }
  | { type: "clearSession"; payload?: never }
  | { type: "enterRoom"; payload: { groupId: string } };

/** 네이티브가 보관하는 세션 토큰 쌍. `getSession` 응답으로 웹에 전달된다. */
export interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

/**
 * 웹 → 네이티브 응답. 항상 객체로 반환한다(@geongyu/react-native-bridge는 falsy 응답 시 콜백을 건너뜀).
 * `session` 은 `getSession` 응답에만 실린다(네이티브에 세션이 없으면 null).
 */
export type WebToNativeResponse = {
  success: boolean;
  session?: SessionTokens | null;
};

/**
 * 네이티브 → 웹 요청.
 * - `back`: 네이티브 뒤로가기(안드로이드 하드웨어 백)를 웹 스택으로 위임한다.
 *   네이티브가 스크린을 직접 pop하면 웹 stack-link 스택의 여러 단계를 한 번에 건너뛰므로,
 *   back을 웹으로 넘겨 뒤로가기의 단일 진실을 웹 스택에 둔다.
 *   웹 스택이 남아 있으면 웹이 한 단계 되돌리고 `consumed: true`를 응답하며,
 *   비었으면 `consumed: false`를 응답해 네이티브가 스크린을 pop하도록 한다.
 * - `focus`: 다른 스크린이 pop돼 이 WebView가 다시 노출될 때 네이티브가 보낸다.
 *   네이티브가 WebView를 덮어도 DOM `visibilitychange`/`focus`가 발생하지 않아 웹이 복귀를
 *   감지하지 못하고, 그 사이 다른 스크린에서 바뀐 서버 상태가 이 화면에 반영되지 않는다.
 *   이 요청을 받으면 웹은 React Query 캐시를 무효화해 활성 쿼리를 다시 가져온다.
 */
export type NativeToWebRequest = { type: "back" } | { type: "focus" };

/**
 * 네이티브 → 웹 응답. `consumed: true`면 웹이 뒤로가기를 처리했으니 네이티브는 pop하지 않는다.
 * 항상 객체로 반환한다(@geongyu/react-native-bridge는 falsy 응답 시 콜백을 건너뜀).
 */
export type NativeToWebResponse = { consumed: boolean };
