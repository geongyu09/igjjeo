import { useSuspenseQuery } from "@tanstack/react-query";
import { listMembers } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseGroupMembersSuspenseQueryProps {
  groupId: string;
}

/** 방 멤버 목록 (GET /groups/{groupId}/members). */
export function useGroupMembersSuspenseQuery({
  groupId,
}: UseGroupMembersSuspenseQueryProps) {
  return useSuspenseQuery({
    queryKey: queryKeys.groupMembers(groupId),
    queryFn: () => listMembers({ groupId }),
  });
}
