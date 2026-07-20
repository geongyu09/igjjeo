import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { StackActions } from "@react-navigation/native";

import { navigationRef } from "../navigation/navigationRef";
import { onboardingStore } from "../session/onboardingStore";
import { sessionStore } from "../session/sessionStore";

// 웹 → 네이티브 브리지 요청 처리 (탭 WebView·상세 WebScreen 공용, @geongyu/react-native-bridge).
// webview-architecture 네비게이션 플로우: 탭에서 상세 진입은 풀스크린 스크린 하나 push,
// 웹 스택이 비어 뒤로가면 그 스크린을 pop해 탭으로 복귀.
// 세션은 네이티브가 소유한다(로그인이 네이티브 화면) — getSession/clearSession 으로 웹과 동기화한다.
export async function handleBridgeMessage(
  message: WebToNativeRequest,
): Promise<WebToNativeResponse> {
  switch (message.type) {
    case "getSession": {
      // 탭 WebView(웹)가 마운트 시 요청 — 네이티브가 보관한 세션 토큰을 실어 응답한다(없으면 null).
      const session = await sessionStore.load();
      return { success: true, session };
    }
    case "clearSession":
      // 웹 로그아웃 → 네이티브 세션·온보딩 기록까지 비우고 온보딩 화면부터 다시 보게 한다.
      await Promise.all([sessionStore.clear(), onboardingStore.clear()]);
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: "Onboarding" }] });
      }
      return { success: true };
    case "pushScreen":
      if (!navigationRef.isReady()) return { success: false };
      navigationRef.dispatch(
        StackActions.push("WebScreen", { url: message.payload.url }),
      );
      return { success: true };
    case "replaceScreen":
      // 현재 스크린을 풀스크린 WebScreen 하나로 교체(스택에 쌓지 않음).
      // 방 안(Tabs)에서 방 허브(/group)로 나갈 때 등, 뒤로 돌아갈 대상이 아니라 화면을 갈아끼운다.
      if (!navigationRef.isReady()) return { success: false };
      navigationRef.dispatch(
        StackActions.replace("WebScreen", { url: message.payload.url }),
      );
      return { success: true };
    case "popScreen":
      if (!navigationRef.isReady()) return { success: false };
      if (navigationRef.canGoBack()) navigationRef.dispatch(StackActions.pop());
      return { success: true };
    case "enterRoom":
      // 방 허브(웹 /group)에서 방을 골라 들어감 — 하단 탭 화면으로 스택을 교체한다.
      // 어떤 방인지는 웹이 소유한다(활성 방은 웹 activeGroupStore) — 여기선 화면만 바꾼다.
      if (!navigationRef.isReady()) return { success: false };
      navigationRef.reset({ index: 0, routes: [{ name: "Tabs" }] });
      return { success: true };
    case "closeReportModal":
      // 제보 발행 완료 → 최상단 제보 모달(ReportModal)을 pop해 탭으로 복귀한다.
      // preview는 웹 stack-link 스택이 남아 있어도 모달 전체를 닫는다(popScreen과 구분).
      if (!navigationRef.isReady()) return { success: false };
      if (navigationRef.canGoBack()) navigationRef.dispatch(StackActions.pop());
      return { success: true };
    default:
      return { success: false };
  }
}
