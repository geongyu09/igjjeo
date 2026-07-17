import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMe, type UpdateMeParams } from "@/lib/data/profile";
import { queryKeys } from "@/hooks/features/query/keys";

/** 프로필 수정 (PATCH /me). 성공 시 내 프로필 캐시를 응답으로 갱신. */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateMeParams) => updateMe(params),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.me(), profile);
    },
  });
}
