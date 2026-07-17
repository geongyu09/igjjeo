import { StyleSheet, View } from "react-native";

import { WEB_BG } from "../../config/env";

// 대응 웹 라우트가 없는 탭(검색·알림) 자리 — tabPress를 막아 두므로 실제 표시되지 않는다.
export function PlaceholderScreen() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
