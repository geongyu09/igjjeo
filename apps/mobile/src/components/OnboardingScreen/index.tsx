import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_BG } from "../../config/env";
import { OnboardingSection } from "./OnboardingSection";

// 첫 진입 온보딩 — 앱을 처음 열었을 때 로그인 전에 뜨는 설명 4장. 화면(UI)은 웹이 그리고
// (webview-architecture: 모든 화면은 웹), 네이티브는 풀스크린 WebView 껍데기만 담당한다.
// 탭 바가 없는 화면이라 safe area 는 위·아래 모두 처리한다. 실제 로직은 OnboardingSection 에 있다.
export function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <OnboardingSection />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
