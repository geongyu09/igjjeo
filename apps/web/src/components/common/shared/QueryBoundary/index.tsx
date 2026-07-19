"use client";

/**
 * suspense 쿼리용 fallback 경계. 한 번에 로딩·오류 UI를 붙인다.
 *
 * - 데이터 로딩 중: `pending`(기본 LoadingScreen) 표시(Suspense).
 * - 쿼리가 던진 오류: `errorFallback`(기본 ErrorScreen + 재시도) 표시(ErrorBoundary).
 * - 재시도 시 React Query의 `reset()`으로 실패한 쿼리를 초기화해 다시 fetch한다.
 *
 * 데이터에 의존하는 화면 본문을 이 경계로 감싼다. 정적 header/footer는 밖에 둔다.
 */

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";
import { SessionExpiredScreen } from "@/components/common/shared/SessionExpiredScreen";
import {
  ErrorBoundary,
  type ErrorBoundaryFallbackProps,
} from "@/components/common/shared/ui/ErrorBoundary";
import { ErrorScreen } from "@/components/common/shared/ui/ErrorScreen";
import { LoadingScreen } from "@/components/common/shared/ui/LoadingScreen";
import { isAuthError } from "@/lib/api/errors";

interface QueryBoundaryProps {
  children: ReactNode;
  /** 로딩 fallback 오버라이드 (기본: LoadingScreen) */
  pending?: ReactNode;
  /** 오류 fallback 오버라이드 (기본: ErrorScreen + 재시도) */
  errorFallback?: (props: ErrorBoundaryFallbackProps) => ReactNode;
}

export function QueryBoundary({
  children,
  pending,
  errorFallback,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={
            errorFallback ??
            (({ error, reset: retry }) =>
              // 인증 오류(세션 만료·무효)는 재시도로 풀리지 않는다 — 로그아웃 후 로그인 화면으로.
              isAuthError(error) ? (
                <SessionExpiredScreen />
              ) : (
                <ErrorScreen error={error} onRetry={retry} />
              ))
          }
        >
          <Suspense fallback={pending ?? <LoadingScreen />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
