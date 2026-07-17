import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_BG } from "../../config/env";
import { WebPane } from "../WebPane";

// 웹 라우트 하나를 렌더하는 탭 화면을 만든다. 하단은 네이티브 탭 바가 차지하므로
// safe area는 위쪽만 처리한다. React Navigation의 component prop이 커스텀 prop을
// 넘기지 못하므로 경로를 클로저로 고정하는 팩토리로 만든다.
export function createWebTabScreen(path: string) {
  return function WebTabScreen() {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <WebPane path={path} />
      </SafeAreaView>
    );
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
