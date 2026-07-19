"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useCallback } from "react";
import { useStackLinkRouter } from "stack-link";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";

/**
 * 제보 발행 완료 후 네이티브 제보 모달(ReportModal 스크린)을 닫는다.
 *
 * 모달 여닫기는 네이티브 소유(탭에서 열고 X 버튼으로 닫음)라, 발행 성공 시 웹은 모달을
 * 직접 닫을 수 없고 브리지로 요청한다. preview는 웹 stack-link 스택이 남아 있어
 * (`canGoBack=true`) 범용 popScreen의 의미("웹 스택이 비었을 때 탭 복귀")와 어긋나므로
 * 전용 closeReportModal 메시지를 쓴다.
 *
 * - 네이티브 셸(앱 WebView) 안: @geongyu/react-native-bridge로 모달 닫기를 요청한다.
 * - 브라우저 프로토타입: 닫을 네이티브 모달이 없으므로 stack-link로 피드로 이동한다.
 */
export function useCloseReportModal() {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const { navigate } = useStackLinkRouter({});

  return useCallback(() => {
    if (isNativeShell) {
      // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
      request({ requestMessage: { type: "closeReportModal" } });
      return;
    }
    navigate({ href: "/", animation: "none" });
  }, [isNativeShell, request, navigate]);
}
