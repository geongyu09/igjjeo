import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup, type UpdateGroupParams } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

/** 방 이름 변경 (PATCH /groups/{groupId}, owner 전용). */
export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateGroupParams) => updateGroup(params),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.group(group.id), group);
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}
