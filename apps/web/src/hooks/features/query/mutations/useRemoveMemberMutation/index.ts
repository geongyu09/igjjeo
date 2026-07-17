import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember, type RemoveMemberParams } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

/** 방 나가기(본인) 또는 강퇴(owner) (DELETE /groups/{groupId}/members/{userId}). */
export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: RemoveMemberParams) => removeMember(params),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}
