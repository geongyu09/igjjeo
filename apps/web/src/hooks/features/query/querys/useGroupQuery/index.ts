import { useQuery } from "@tanstack/react-query";
import { getGroup } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseGroupQueryProps {
  groupId: string;
}

/** 방 상세 (GET /groups/{groupId}). */
export function useGroupQuery({ groupId }: UseGroupQueryProps) {
  return useQuery({
    queryKey: queryKeys.group(groupId),
    queryFn: () => getGroup({ groupId }),
    enabled: Boolean(groupId),
  });
}
