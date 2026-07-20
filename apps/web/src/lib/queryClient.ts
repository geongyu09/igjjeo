/**
 * React Query 클라이언트 팩토리 (App Router 패턴).
 * 서버에서는 요청마다 새로, 브라우저에서는 싱글턴을 재사용한다.
 */

import { isServer, QueryClient } from "@tanstack/react-query";
import { isApiError, isConnectionError } from "@/lib/api/errors";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) => {
          // 4xx(클라이언트 오류)는 재시도해도 결과가 같으므로 즉시 중단
          if (isApiError(error) && error.status >= 400 && error.status < 500) {
            return false;
          }
          // 서버에 닿지 못한 요청은 매번 타임아웃까지 기다린다 — 재시도를 겹치면
          // 로딩이 몇 배로 길어진다. 일시적 끊김만 한 번 흡수하고 오류 화면으로 넘긴다.
          if (isConnectionError(error)) {
            return failureCount < 1;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
