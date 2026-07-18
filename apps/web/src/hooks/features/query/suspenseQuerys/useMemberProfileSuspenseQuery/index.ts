import { useSuspenseQuery } from "@tanstack/react-query";
import { getMemberProfile } from "@/lib/data/profile";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseMemberProfileSuspenseQueryProps {
  groupId: string;
}

/** 방 안에서의 내 프로필 요약 (GET /groups/{groupId}/me/profile). */
export function useMemberProfileSuspenseQuery({
  groupId,
}: UseMemberProfileSuspenseQueryProps) {
  return useSuspenseQuery({
    queryKey: queryKeys.memberProfile(groupId),
    queryFn: () => getMemberProfile({ groupId }),
  });
}
