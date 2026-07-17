import { useQuery } from "@tanstack/react-query";
import { listMembers } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseGroupMembersQueryProps {
  groupId: string;
}

/** 방 멤버 목록 (GET /groups/{groupId}/members). */
export function useGroupMembersQuery({ groupId }: UseGroupMembersQueryProps) {
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId),
    queryFn: () => listMembers({ groupId }),
    enabled: Boolean(groupId),
  });
}
