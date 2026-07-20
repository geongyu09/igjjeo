"use client";

import { useEffect, type ReactNode } from "react";
import { InstallLanding } from "@/components/feature/pages/invite/InstallLanding";
import { useIsNativeShell } from "@/hooks/common/useIsNativeShell";
import { useInviteParam } from "@/hooks/features/group/useInviteParam";
import { pendingInviteStore } from "@/lib/session/pendingInviteStore";

/**
 * 초대 링크(`/?invite=<코드>`) 진입을 세션 게이트보다 먼저 가로챈다.
 *
 * - 브라우저(네이티브 셸 아님): 앱이 없다고 보고 설치 안내(InstallLanding)를 보여 준다.
 *   로그인은 네이티브만 하므로 브라우저에서는 방에 참여할 수 없어, 설치로 유도한다.
 * - 앱(네이티브 셸): OS가 Universal/App Link로 앱을 직접 연 경우다. 코드를 pendingInviteStore에
 *   보관하고(로그인·온보딩 사이에 잃지 않도록) URL을 정리한 뒤 그대로 통과시킨다 —
 *   세션이 준비되면 PendingInviteConsumer가 이 코드로 방에 자동 참여한다.
 */
export function InviteGate({ children }: { children: ReactNode }) {
  const code = useInviteParam();
  const isNativeShell = useIsNativeShell();

  useEffect(() => {
    if (!code || !isNativeShell) return;
    pendingInviteStore.set(code);
    const url = new URL(window.location.href);
    if (url.searchParams.has("invite") || url.searchParams.has("code")) {
      url.searchParams.delete("invite");
      url.searchParams.delete("code");
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash,
      );
    }
  }, [code, isNativeShell]);

  if (code && !isNativeShell) {
    return <InstallLanding code={code} />;
  }
  return <>{children}</>;
}
