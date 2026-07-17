import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup, type CreateGroupParams } from "@/lib/data/groups";
import { queryKeys } from "@/hooks/features/query/keys";

/** 방 생성 (POST /groups). 성공 시 방 목록 무효화. */
export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateGroupParams) => createGroup(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}
