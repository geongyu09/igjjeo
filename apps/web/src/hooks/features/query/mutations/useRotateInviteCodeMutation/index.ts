import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rotateInviteCode, type GroupIdParams } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

/** 초대 코드 재발급 (POST /groups/{groupId}/invite-code/rotate, owner 전용). */
export function useRotateInviteCodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: GroupIdParams) => rotateInviteCode(params),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
    },
  });
}
