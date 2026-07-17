import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinGroup, type JoinGroupParams } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

/** 초대 코드로 방 참여 (POST /groups/join). 성공 시 방 목록 무효화. */
export function useJoinGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: JoinGroupParams) => joinGroup(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}
