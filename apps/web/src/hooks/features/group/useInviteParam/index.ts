"use client";

import { useSyncExternalStore } from "react";
import { normalizeInviteCode } from "@/lib/invite";

/**
 * 현재 URL 쿼리에서 정규화된 초대 코드를 읽는다(없으면 null).
 *
 * 초대 링크는 `/?invite=<코드>`(루트) 또는 `/invite?code=<코드>`(경로형, Android App Links·
 * 커스텀 스킴과 대응) 두 형태로 들어올 수 있어, 라우트가 아니라 `invite`/`code` 쿼리로 감지한다.
 * useSyncExternalStore로 useIsNativeShell과 같은 계약을 따른다 — SSR에서는 null, 클라이언트
 * 하이드레이션 직후 실제 값. location은 반응형이 아니므로 구독은 no-op(1회성).
 */
const subscribe = () => () => {};

function getSnapshot(): string | null {
  const params = new URLSearchParams(window.location.search);
  return normalizeInviteCode(params.get("invite") ?? params.get("code"));
}

const getServerSnapshot = (): string | null => null;

export function useInviteParam(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
