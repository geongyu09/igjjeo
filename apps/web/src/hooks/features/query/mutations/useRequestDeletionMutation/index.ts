import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestDeletion } from "@/lib/data/corrections";
import { queryKeys } from "@/hooks/features/query/keys";

interface RequestDeletionVariables {
  articleId: string;
  idempotencyKey?: string;
  /** 삭제 후 무효화할 방 피드(선택). 데이터 호출엔 쓰지 않음. */
  groupId?: string;
}

/** 당사자 기사 삭제 요청 (POST /articles/{articleId}/deletion-request). 즉시 is_active=false. */
export function useRequestDeletionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, idempotencyKey }: RequestDeletionVariables) =>
      requestDeletion({ articleId, idempotencyKey }),
    onSuccess: (_data, { articleId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(groupId) });
      }
    },
  });
}
