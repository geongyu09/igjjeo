"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { tokenStore } from "@/lib/api/tokenStore";
import { activeGroupStore } from "@/lib/session/activeGroupStore";

/**
 * 세션 만료·무효(401)로 "로그인이 필요"한 상태의 복구 동작 — 로그아웃 후 로그인 화면으로.
 *
 * 반환한 함수를 호출하면(사용자가 "로그인 하러 가기"를 누르면) 로컬 세션·활성 방·서버 상태
 * 캐시를 비운다. tokenStore를 폐기하면 useHasSession이 뒤집혀 세션 게이트가 로그아웃 상태로
 * 돌아간다(브라우저에선 로그인 안내 화면).
 *
 * 세션의 원천은 네이티브다 — clear가 아니라 revoke를 쓴다. 폐기 표시를 보고
 * useSyncNativeSessionRevoke가 네이티브 세션까지 지우고 로그인 스크린으로 되돌린다.
 * 브리지 전송을 그쪽 한 곳으로 모아, 자동 폐기(401)와 수동 복구가 같은 경로를 타게 한다.
 */
export function useSessionExpiredRecovery(): () => void {
  const queryClient = useQueryClient();

  return useCallback(() => {
    tokenStore.revoke();
    activeGroupStore.clear();
    queryClient.clear();
  }, [queryClient]);
}
