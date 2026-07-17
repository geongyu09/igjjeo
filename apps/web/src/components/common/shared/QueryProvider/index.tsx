"use client";

/**
 * React Query Provider. 앱에 서버 상태 계층을 적용할 때 루트 레이아웃에서 감싼다.
 * (현재는 마운트하지 않음 — API 적용 단계에서 layout.tsx에 배선.)
 */

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/queryClient";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
