import { useSyncExternalStore } from "react";
import { activeGroupStore } from "@/lib/session/activeGroupStore";

/**
 * 활성 방 id를 반응형으로 노출한다.
 *
 * activeGroupStore를 useSyncExternalStore로 구독하므로, 방을 고르거나(방 진입) 로그아웃으로
 * 활성 방이 비워지면 이 훅을 쓰는 컴포넌트가 자동으로 다시 렌더된다. 서버 렌더에서는 항상 null이다.
 */
export function useActiveGroupId(): string | null {
  return useSyncExternalStore(
    activeGroupStore.subscribe,
    () => activeGroupStore.get(),
    () => null,
  );
}
