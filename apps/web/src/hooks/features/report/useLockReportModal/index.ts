"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useEffect } from "react";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";

/**
 * 네이티브 제보 모달(ReportModal 스크린)의 닫기를 잠근다.
 *
 * AI 각색처럼 되돌릴 수 없는 요청이 진행 중일 때, 웹은 자기 화면을 오버레이·inert로 막을 수
 * 있지만 모달 헤더의 X 버튼과 안드로이드 하드웨어 백은 네이티브 소유라 웹이 막을 수 없다.
 * 그래서 잠금 여부를 브리지로 동기화한다.
 *
 * 잠근 채로 언마운트되면 모달이 영영 닫히지 않으므로 정리 시 반드시 해제한다.
 * 네이티브 셸 밖(브라우저)에서는 no-op.
 */
export function useLockReportModal(locked: boolean) {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();

  useEffect(() => {
    if (!isNativeShell) return;
    // 응답이 필요 없는 요청 — responseCallback을 넘기지 않아 RWindow 적체를 피한다.
    const send = (dismissible: boolean) =>
      request({
        requestMessage: {
          type: "setReportModalDismissible",
          payload: { dismissible },
        },
      });

    send(!locked);
    if (!locked) return;
    return () => send(true);
  }, [locked, isNativeShell, request]);
}
