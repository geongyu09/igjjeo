import { useInfiniteQuery } from "@tanstack/react-query";
import { listGroups } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

/** 내가 속한 방 목록 (GET /groups, 커서 페이지네이션). */
export function useGroupsQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.groups(),
    queryFn: ({ pageParam }) => listGroups({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}
