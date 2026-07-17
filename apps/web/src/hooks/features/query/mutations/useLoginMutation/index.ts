import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, type LoginParams } from "@/lib/data/auth";
import { queryKeys } from "@/hooks/features/query/keys";

/** 로그인 (POST /auth/login). 성공 시 토큰 저장 + 내 프로필 캐시 무효화. */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: LoginParams) => login(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
