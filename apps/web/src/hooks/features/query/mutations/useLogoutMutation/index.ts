import { useBridge } from "@geongyu/react-native-bridge/web";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";
import { logout } from "@/lib/data/auth";
import { activeGroupStore } from "@/lib/session/activeGroupStore";

/** 로그아웃 (POST /auth/logout). 성공 시 서버 상태 캐시를 전부 비운다. */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const isNativeShell = useIsNativeShell();
  const { request } = useBridge<WebToNativeRequest, WebToNativeResponse>();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
      // 활성 방 선택도 세션과 함께 비운다(다음 로그인은 방 허브에서 다시 고른다).
      activeGroupStore.clear();
      // 세션 원천은 네이티브다 — 네이티브 셸이면 보관 세션까지 지우고 로그인 스크린으로 되돌린다.
      if (isNativeShell) {
        request({ requestMessage: { type: "clearSession" } });
      }
    },
  });
}
