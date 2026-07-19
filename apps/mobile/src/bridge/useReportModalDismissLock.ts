import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";

import type { RootStackParamList } from "../navigation/types";
import { handleBridgeMessage } from "./handleBridgeMessage";

type ReportModalNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "ReportModal"
>;

/**
 * 제보 모달의 "닫기 가능 여부"를 웹과 동기화한다 (브리지 setReportModalDismissible).
 *
 * AI 각색처럼 되돌릴 수 없는 요청이 진행 중이면 웹이 자기 화면을 오버레이로 잠그지만,
 * 모달 헤더의 X 버튼과 안드로이드 하드웨어 백은 네이티브 소유라 웹이 막을 수 없다.
 * 잠금 중에는 두 경로를 모두 차단한다 (스와이프 dismiss는 App.tsx에서 상시 비활성).
 *
 * 반환하는 `onBridgeMessage`를 WebPane에 넘긴다 — 이 메시지만 여기서 처리하고 나머지는
 * 공용 handleBridgeMessage에 위임한다 (WebScreen의 setSwipeBackEnabled와 같은 패턴).
 */
export function useReportModalDismissLock(navigation: ReportModalNavigation) {
  const [dismissible, setDismissible] = useState(true);

  const onBridgeMessage = useCallback(
    async (message: WebToNativeRequest): Promise<WebToNativeResponse> => {
      if (message.type === "setReportModalDismissible") {
        setDismissible(message.payload.dismissible);
        return { success: true };
      }
      return handleBridgeMessage(message);
    },
    [],
  );

  // 잠금 중에는 이 스크린을 떠나는 모든 시도를 막는다 — 닫기 버튼(goBack)과 하드웨어 백 모두.
  useEffect(() => {
    if (dismissible) return;
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      event.preventDefault();
    });
    return unsubscribe;
  }, [navigation, dismissible]);

  return { dismissible, onBridgeMessage };
}
