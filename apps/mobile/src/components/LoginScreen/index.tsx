import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_BG } from "../../config/env";
import { BlurReveal } from "./BlurReveal";
import { LoginSection } from "./LoginSection";

// 로그인 — 앱이 직접 그리는 네이티브 화면(웹뷰 아님). webview-architecture 의 유일한 예외로,
// Google/Apple 소셜 로그인은 네이티브 SDK 가 필요해 여기서 처리한다. 루트 스택의 초기 라우트라
// Tabs 는 로그인 성공(또는 기존 세션 감지) 후에만 진입한다. 실제 로직은 LoginSection 에 있다.
// 로그아웃 후(clearSession → Login 리셋) 화면이 마운트되면 BlurReveal 이 블러를 걷어내며 등장시킨다.
export function LoginScreen() {
  return (
    <BlurReveal>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <LoginSection />
      </SafeAreaView>
    </BlurReveal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
