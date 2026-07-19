import { usePostMessageBridge } from "@geongyu/react-native-bridge/native";
import type {
  NativeToWebRequest,
  NativeToWebResponse,
} from "@igjjeo/bridge-contract";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWebFocusRefetch } from "../../bridge/useWebFocusRefetch";
import { WEB_BG } from "../../config/env";
import { WebPane } from "../WebPane";

// 웹 라우트 하나를 렌더하는 탭 화면을 만든다. 하단은 네이티브 탭 바가 차지하므로
// safe area는 위쪽만 처리한다. React Navigation의 component prop이 커스텀 prop을
// 넘기지 못하므로 경로를 클로저로 고정하는 팩토리로 만든다.
//
// 상세/모달 스크린이 이 탭 위에 쌓였다 사라져 다시 포커스되면 웹에 focus를 보내 refetch시킨다
// (useWebFocusRefetch). 그래서 탭 WebView도 네이티브→웹 브리지 ref를 연결한다.
export function createWebTabScreen(path: string) {
  return function WebTabScreen() {
    // 네이티브 onResponse에는 봉투 전체가 온다(geongyu-bridge 주의사항 2번) — 여기선 응답을 쓰지 않는다.
    const { ref, postMessage } = usePostMessageBridge<
      NativeToWebRequest,
      { body?: NativeToWebResponse }
    >();
    useWebFocusRefetch(() => postMessage({ message: { type: "focus" } }));

    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <WebPane path={path} bridgeRef={ref} />
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
