"use client";

import { useSyncExternalStore } from "react";
import { pendingInviteStore } from "@/lib/session/pendingInviteStore";

/**
 * 대기 중인 초대 코드를 반응형으로 구독한다(없으면 null).
 * pendingInviteStore(external store)를 useSyncExternalStore로 감싼다.
 */
export function usePendingInvite(): string | null {
  return useSyncExternalStore(
    pendingInviteStore.subscribe,
    () => pendingInviteStore.get(),
    () => null,
  );
}
