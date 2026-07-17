import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/data/feed";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseFeedSuspenseQueryProps {
  groupId: string;
}

/** 방 피드 (GET /groups/{groupId}/feed, 제보 묶음 단위 커서 페이지네이션). */
export function useFeedSuspenseQuery({ groupId }: UseFeedSuspenseQueryProps) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.feed(groupId),
    queryFn: ({ pageParam }) => getFeed({ groupId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}
