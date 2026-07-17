import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_BG } from "../../config/env";
import { WebPane } from "../WebPane";

// 제보하기 모달. 헤더(타이틀·닫기)는 네이티브가 그리므로 웹 /report는 자기 헤더를
// 렌더하지 않는다 (apps/web의 useIsNativeShell 분기). 상단 safe area는 헤더가 처리한다.
export function ReportModalScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <WebPane path="/report" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
