"use client";

/**
 * 세션 컨텍스트 — 로그인한 내 프로필과 활성 방(groupId)을 앱 전역에 제공한다.
 *
 * 미인증(액세스 토큰 없음)이면 로그인/회원가입 화면(AuthScreen)을 렌더하고, 로그인에
 * 성공하면 토큰 저장을 구독하는 게이트가 자동으로 앱 화면으로 전환한다. 로그아웃 시
 * 토큰이 비워지면 같은 경로로 다시 로그인 화면으로 돌아온다.
 *
 * 활성 방은 `/groups` 목록의 첫 방으로 정한다(방 전환 UI는 이후 과제).
 * 내부에서 suspense 쿼리를 쓰므로, 상위(layout)에서 QueryBoundary로 감싸
 * 로딩·오류 fallback을 붙인다.
 *
 * 방이 하나도 없으면 activeGroupId는 null — 방 데이터에 의존하는 화면은 이 값을 보고
 * "방에 참여하세요" 같은 빈 상태를 그린다.
 */

import {
  createContext,
  use,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LoadingScreen } from "@/components/common/shared/ui/LoadingScreen";
import { useHasSession } from "@/hooks/common/useHasSession";
import { useGroupsSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useGroupsSuspenseQuery";
import { useMeSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useMeSuspenseQuery";
import type { Group, Profile } from "@/lib/api/types";
import { AuthScreen } from "./components/AuthScreen";

interface SessionValue {
  me: Profile;
  /** 내가 속한 방 목록(첫 페이지 이상 로드된 전체) */
  groups: Group[];
  /** 활성 방 id — 방이 없으면 null */
  activeGroupId: string | null;
}

const SessionContext = createContext<SessionValue | null>(null);

const emptySubscribe = () => () => {};

/** 서버 렌더에선 false, 클라이언트에선 true — 이펙트 없이 하이드레이션 안전하게 감지. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * 세션 토큰은 localStorage 기반(클라이언트 전용)이므로 데이터 패칭도 클라이언트에서만 한다.
 * 서버 프리렌더 단계에선 로딩 화면만 그려 API 호출이 서버에서 실행되지 않게 막는다.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  if (!isClient) return <LoadingScreen label="시작하는 중" />;
  return <SessionGate>{children}</SessionGate>;
}

/** 토큰 유무로 로그인 화면과 앱 화면을 가르는 게이트. 토큰 변경에 반응해 자동 전환한다. */
function SessionGate({ children }: { children: ReactNode }) {
  const hasSession = useHasSession();
  if (!hasSession) return <AuthScreen />;
  return <SessionBootstrap>{children}</SessionBootstrap>;
}

function SessionBootstrap({ children }: { children: ReactNode }) {
  // 확보된 세션으로 내 프로필·방 목록 조회
  const { data: me } = useMeSuspenseQuery();
  const { data: groupPages } = useGroupsSuspenseQuery();

  const value = useMemo<SessionValue>(() => {
    const groups = groupPages.pages.flatMap((page) => page.items);
    return {
      me,
      groups,
      activeGroupId: groups[0]?.id ?? null,
    };
  }, [me, groupPages]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

/** 세션 컨텍스트 소비 훅. SessionProvider 밖에서 호출하면 던진다. */
export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) {
    throw new Error(
      "useSession은 SessionProvider 안에서만 사용할 수 있습니다.",
    );
  }
  return value;
}
