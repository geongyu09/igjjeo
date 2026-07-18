import { usePostMessageBridge } from "@geongyu/react-native-bridge/native";
import type {
  NativeToWebRequest,
  NativeToWebResponse,
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { BackHandler, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { handleBridgeMessage } from "../../bridge/handleBridgeMessage";
import { WEB_BG } from "../../config/env";
import type { RootStackParamList } from "../../navigation/types";
import { WebPane } from "../WebPane";

// 네이티브→웹 back 요청에 응답이 없을 때(핸드셰이크 미완료·웹 리로드 등) 스크린을 pop하는
// 폴백 대기시간. 브리지는 타임아웃이 없어(geongyu-bridge 주의사항 4번) 직접 둔다.
const NATIVE_BACK_FALLBACK_MS = 250;

// 탭에서 진입하는 풀스크린 상세 WebView. 탭 바를 가리므로 safe area를 위·아래 모두 처리한다.
// 이후 화면 전환은 이 WebView 안에서 전부 웹(stack-link)으로 진행된다.
//
// 뒤로가기: iOS 스와이프 제스처는 웹 canGoBack에 따라 켜고 끈다(setSwipeBackEnabled — 스크린
// 통째 pop이 웹 스택 여러 단계를 건너뛰는 걸 막고, 웹 루트에선 스와이프로 탭 복귀를 허용).
// 안드로이드 하드웨어 백은 아래에서 웹으로 위임한다.
export function WebScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "WebScreen">) {
  // 네이티브 onResponse에는 봉투 전체가 온다 — 실제 응답은 body에 있다(geongyu-bridge 주의사항 2번).
  const { ref, postMessage } = usePostMessageBridge<
    NativeToWebRequest,
    { body?: NativeToWebResponse }
  >();

  // 웹→네이티브 요청 처리: 스와이프 백 제스처 토글은 이 스크린에서 직접 적용하고,
  // 나머지(push/popScreen)는 공용 handleBridgeMessage에 위임한다.
  const onBridgeMessage = useCallback(
    async (
      message: WebToNativeRequest,
    ): Promise<WebToNativeResponse> => {
      if (message.type === "setSwipeBackEnabled") {
        navigation.setOptions({ gestureEnabled: message.payload.enabled });
        return { success: true };
      }
      return handleBridgeMessage(message);
    },
    [navigation],
  );

  // 안드로이드 하드웨어 백: 네이티브 스택을 바로 pop하면 웹 stack-link 여러 단계를 건너뛴다.
  // back을 웹으로 위임하고, 웹이 처리하지 못하거나(consumed:false) 응답이 없으면(폴백)
  // 그때 스크린을 pop한다. iOS엔 하드웨어 백이 없어 이 핸들러는 호출되지 않는다.
  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        let settled = false;
        const popIfNeeded = (consumed: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (!consumed && navigation.canGoBack()) navigation.goBack();
        };
        const timer = setTimeout(
          () => popIfNeeded(false),
          NATIVE_BACK_FALLBACK_MS,
        );
        postMessage({
          message: { type: "back" },
          onResponse: (response) =>
            popIfNeeded(response?.body?.consumed ?? false),
        });
        return true; // 기본 pop 차단 — 처리를 웹 응답에 위임한다.
      };
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onHardwareBack,
      );
      return () => sub.remove();
    }, [navigation, postMessage]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <WebPane
        path={route.params.url}
        bridgeRef={ref}
        onBridgeMessage={onBridgeMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
