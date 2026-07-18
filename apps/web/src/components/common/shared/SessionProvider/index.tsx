"use client";

/**
 * 세션 컨텍스트 — 로그인한 내 프로필과 활성 방(groupId)을 앱 전역에 제공한다.
 *
 * 로그인은 네이티브(Google/Apple)가 담당한다. 미인증(액세스 토큰 없음)이면 네이티브가
 * 보관한 세션을 브리지로 복원하고, 토큰이 저장되면 게이트가 자동으로 앱 화면으로 전환한다.
 * 신규 사용자의 기본 정보(이름) 입력은 웹 온보딩 화면이 담당한다. 로그아웃 시 토큰이
 * 비워지면 같은 경로로 다시 세션 복원 단계로 돌아온다.
 *
 * 활성 방은 사용자가 방 허브(`/group`)에서 고른 방(activeGroupStore)이다. 저장된 방이 아직
 * 내 방 목록에 있을 때만 유효로 취급한다(나간 방·만료 대비). 내부에서 suspense 쿼리를 쓰므로,
 * 상위(layout)에서 QueryBoundary로 감싸 로딩·오류 fallback을 붙인다.
 *
 * 아직 고른 방이 없거나 방이 하나도 없으면 activeGroupId는 null — 방 데이터에 의존하는 화면은
 * 이 값을 보고 "방에 참여하세요" 같은 빈 상태를 그린다.
 */

import {
  createContext,
  use,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LoadingScreen } from "@/components/common/shared/ui/LoadingScreen";
import { useActiveGroupId } from "@/hooks/common/useActiveGroupId";
import { useHasSession } from "@/hooks/common/useHasSession";
import { useRestoreNativeSession } from "@/hooks/common/useRestoreNativeSession";
import { useGroupsSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useGroupsSuspenseQuery";
import { useMeSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useMeSuspenseQuery";
import type { Group, Profile } from "@/lib/api/types";
import { NoSessionScreen } from "./components/NoSessionScreen";
import { OnboardingForm } from "./components/OnboardingForm";

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

/**
 * 세션 유무로 화면을 가르는 게이트. 로그인은 네이티브(Google/Apple)가 담당하므로,
 * 세션이 없으면 네이티브가 보관한 세션을 브리지로 복원한다(useRestoreNativeSession).
 * 복원 중에는 로딩, 네이티브 셸이 아니거나 세션이 없으면 안내 화면을 그린다.
 * 토큰이 확보되면 useHasSession 이 뒤집혀 앱 부트스트랩으로 전환된다.
 */
function SessionGate({ children }: { children: ReactNode }) {
  const hasSession = useHasSession();
  const restore = useRestoreNativeSession({ enabled: !hasSession });

  if (!hasSession) {
    if (restore === "restoring") return <LoadingScreen label="세션 확인 중" />;
    return <NoSessionScreen />;
  }
  return <SessionBootstrap>{children}</SessionBootstrap>;
}

function SessionBootstrap({ children }: { children: ReactNode }) {
  // 확보된 세션으로 내 프로필·방 목록 조회
  const { data: me } = useMeSuspenseQuery();
  const { data: groupPages } = useGroupsSuspenseQuery();
  const storedActiveGroupId = useActiveGroupId();

  const value = useMemo<SessionValue>(() => {
    const groups = groupPages.pages.flatMap((page) => page.items);
    // 방 허브에서 고른 방을 활성 방으로 쓰되, 아직 내 방일 때만 유효로 인정한다.
    const activeGroupId = groups.some((group) => group.id === storedActiveGroupId)
      ? storedActiveGroupId
      : null;
    return { me, groups, activeGroupId };
  }, [me, groupPages, storedActiveGroupId]);

  // 소셜 신규 가입 등 기본 정보 미입력(onboarded=false) 사용자는 웹 온보딩 화면으로.
  if (!me.onboarded) {
    return <OnboardingForm defaultName={me.display_name} />;
  }

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
