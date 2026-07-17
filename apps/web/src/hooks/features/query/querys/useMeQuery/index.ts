import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/data/profile";
import { queryKeys } from "@/hooks/features/query/keys";

/** 내 프로필 조회 (GET /me). */
export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
  });
}
