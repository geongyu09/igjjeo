import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup, type SignupParams } from "@/lib/data/auth";
import { queryKeys } from "@/hooks/features/query/keys";

/** 회원가입 (POST /auth/signup). 성공 시 토큰 저장 + 내 프로필 캐시 무효화. */
export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: SignupParams) => signup(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
