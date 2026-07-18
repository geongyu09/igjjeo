import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_BG } from "../../config/env";
import { LoginSection } from "./LoginSection";

// 로그인 — 앱이 직접 그리는 네이티브 화면(웹뷰 아님). webview-architecture 의 유일한 예외로,
// Google/Apple 소셜 로그인은 네이티브 SDK 가 필요해 여기서 처리한다. 루트 스택의 초기 라우트라
// Tabs 는 로그인 성공(또는 기존 세션 감지) 후에만 진입한다. 실제 로직은 LoginSection 에 있다.
export function LoginScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <LoginSection />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
