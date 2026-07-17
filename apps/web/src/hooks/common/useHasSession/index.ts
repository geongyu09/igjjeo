import { useSyncExternalStore } from "react";
import { tokenStore } from "@/lib/api/tokenStore";

/**
 * 로그인 세션(액세스 토큰) 보유 여부를 반응형으로 노출한다.
 *
 * tokenStore를 useSyncExternalStore로 구독하므로, 로그인(토큰 저장)·로그아웃(토큰 삭제)
 * 시 이 훅을 쓰는 컴포넌트가 자동으로 다시 렌더된다. 세션 게이트(SessionProvider)가
 * 이 값으로 로그인 화면과 앱 화면을 가른다. 서버 렌더에서는 항상 false다.
 */
export function useHasSession(): boolean {
  return useSyncExternalStore(
    tokenStore.subscribe,
    () => tokenStore.getAccessToken() !== null,
    () => false,
  );
}
