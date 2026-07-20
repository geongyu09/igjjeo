import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestDeletion } from "@/lib/data/corrections";
import { queryKeys } from "@/hooks/features/query/keys";

interface RequestDeletionVariables {
  articleId: string;
  idempotencyKey?: string;
  /** 삭제 후 무효화할 방 피드(선택). 데이터 호출엔 쓰지 않음. */
  groupId?: string;
}

/** 기사 내리기 요청 (POST /articles/{articleId}/deletion-request). 즉시 is_active=false. */
export function useRequestDeletionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, idempotencyKey }: RequestDeletionVariables) =>
      requestDeletion({ articleId, idempotencyKey }),
    onSuccess: (_data, { articleId, groupId }) => {
      // 내려간 기사의 상세는 404다. 여기서 refetch를 걸면 화면을 떠나기 전에 에러 바운더리가
      // 뜨므로, stale 표시만 하고 다시 불러오지는 않는다.
      queryClient.invalidateQueries({
        queryKey: queryKeys.article(articleId),
        refetchType: "none",
      });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(groupId) });
      }
    },
  });
}
