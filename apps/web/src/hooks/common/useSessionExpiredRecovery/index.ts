"use client";

import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";
import { tokenStore } from "@/lib/api/tokenStore";
import { activeGroupStore } from "@/lib/session/activeGroupStore";

/**
 * 세션 만료·무효(401)로 "로그인이 필요"한 상태의 복구 동작 — 로그아웃 후 로그인 화면으로.
 *
 * 반환한 함수를 호출하면(사용자가 "로그인 하러 가기"를 누르면) 로컬 세션·활성 방·서버 상태
 * 캐시를 비운다. tokenStore를 비우면 useHasSession이 뒤집혀 세션 게이트가 로그아웃 상태로
 * 돌아간다(브라우저에선 로그인 안내 화면). 세션의 원천은 네이티브이므로, 네이티브 셸이면
 * 브리지 clearSession으로 네이티브가 보관한 세션까지 지우고 네이티브 로그인 스크린으로
 * 되돌린다(응답 불필요 — responseCallback 생략).
 */
export function useSessionExpiredRecovery(): () => void {
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();
  const queryClient = useQueryClient();

  return useCallback(() => {
    tokenStore.clear();
    activeGroupStore.clear();
    queryClient.clear();
    if (isNativeShell) {
      request({ requestMessage: { type: "clearSession" } });
    }
  }, [isNativeShell, request, queryClient]);
}
