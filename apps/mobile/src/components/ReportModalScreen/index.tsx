import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useReportModalDismissLock } from "../../bridge/useReportModalDismissLock";
import { WEB_BG } from "../../config/env";
import type { RootStackParamList } from "../../navigation/types";
import { CloseButton } from "../CloseButton";
import { WebPane } from "../WebPane";

// 제보하기 모달. 헤더(타이틀·닫기)는 네이티브가 그리므로 웹 /report는 자기 헤더를
// 렌더하지 않는다 (apps/web의 useIsNativeShell 분기). 상단 safe area는 헤더가 처리한다.
//
// 각색 진행 중에는 웹이 브리지로 잠금을 요청한다(setReportModalDismissible) — 그동안
// 닫기(X) 버튼을 비활성화하고 하드웨어 백으로도 나갈 수 없다.
export function ReportModalScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ReportModal">) {
  const { dismissible, onBridgeMessage } =
    useReportModalDismissLock(navigation);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <CloseButton
          onPress={() => navigation.goBack()}
          disabled={!dismissible}
        />
      ),
    });
  }, [navigation, dismissible]);

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <WebPane path="/report" onBridgeMessage={onBridgeMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
});
