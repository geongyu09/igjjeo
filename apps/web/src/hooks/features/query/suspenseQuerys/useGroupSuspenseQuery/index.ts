import { useSuspenseQuery } from "@tanstack/react-query";
import { getGroup } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseGroupSuspenseQueryProps {
  groupId: string;
}

/** 방 상세 (GET /groups/{groupId}). */
export function useGroupSuspenseQuery({ groupId }: UseGroupSuspenseQueryProps) {
  return useSuspenseQuery({
    queryKey: queryKeys.group(groupId),
    queryFn: () => getGroup({ groupId }),
  });
}
