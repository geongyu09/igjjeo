import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/lib/data/auth";

/** 로그아웃 (POST /auth/logout). 성공 시 서버 상태 캐시를 전부 비운다. */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
