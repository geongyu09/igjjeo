import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  requestCorrection,
  type RequestCorrectionParams,
} from "@/lib/data/corrections";
import { queryKeys } from "@/hooks/features/query/keys";

/**
 * 정정 요청 (POST /articles/{articleId}/correction-requests).
 * is_subject에 따라 당사자 정정(article 1건) / 제3자 정정(articles[])으로 응답이 갈린다.
 * 성공 시 원 기사 상세와 관련 방 피드를 무효화한다.
 */
export function useRequestCorrectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: RequestCorrectionParams) => requestCorrection(params),
    onSuccess: (result, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.articleCorrections(articleId),
      });
      const groupId =
        "article" in result
          ? result.article.group_id
          : result.articles[0]?.group_id;
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(groupId) });
      }
    },
  });
}
