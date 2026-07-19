"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseRefreshFeedProps {
  groupId: string;
}

/**
 * 방 피드를 서버에서 다시 가져온다 (당김 새로고침 등 사용자가 명시적으로 요청한 갱신용).
 *
 * `invalidateQueries`가 아니라 `refetchQueries`를 쓴다 — 반환 Promise가 실제 fetch 완료까지
 * 이어져야 새로고침 인디케이터를 그때까지 돌릴 수 있다. 무한 스크롤로 이미 불러온 페이지도
 * 함께 갱신된다.
 */
export function useRefreshFeed({ groupId }: UseRefreshFeedProps) {
  const queryClient = useQueryClient();

  return useCallback(
    () => queryClient.refetchQueries({ queryKey: queryKeys.feed(groupId) }),
    [queryClient, groupId],
  );
}
