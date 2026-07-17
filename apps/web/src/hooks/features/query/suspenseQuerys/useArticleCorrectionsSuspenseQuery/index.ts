import { useSuspenseQuery } from "@tanstack/react-query";
import { getCorrections } from "@/lib/data/corrections";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseArticleCorrectionsSuspenseQueryProps {
  articleId: string;
}

/** 기사 정정 연쇄/관련 기사 목록 (GET /articles/{articleId}/corrections). */
export function useArticleCorrectionsSuspenseQuery({
  articleId,
}: UseArticleCorrectionsSuspenseQueryProps) {
  return useSuspenseQuery({
    queryKey: queryKeys.articleCorrections(articleId),
    queryFn: () => getCorrections({ articleId }),
  });
}
