"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SessionProvider } from "@/components/common/shared/SessionProvider";

/**
 * 세션이 없어도 볼 수 있는 화면들. 로그인(네이티브) 전에 뜨는 화면이라 세션 게이트를 통과할 수 없다.
 */
const PUBLIC_PATHS = ["/onboarding"];

/**
 * 인증 게이트 — 일반 화면은 SessionProvider로 감싸고, 로그인 전에 떠야 하는 공개 화면
 * (첫 진입 온보딩)은 그대로 그린다.
 *
 * 경로 판별에만 next/navigation의 usePathname을 쓴다 — 화면 전환은 여전히 stack-link 경유다.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  return <SessionProvider>{children}</SessionProvider>;
}
