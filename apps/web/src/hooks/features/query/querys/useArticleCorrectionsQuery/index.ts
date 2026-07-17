import { useQuery } from "@tanstack/react-query";
import { getCorrections } from "@/lib/data/corrections";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseArticleCorrectionsQueryProps {
  articleId: string;
}

/** 기사 정정 연쇄/관련 기사 목록 (GET /articles/{articleId}/corrections). */
export function useArticleCorrectionsQuery({
  articleId,
}: UseArticleCorrectionsQueryProps) {
  return useQuery({
    queryKey: queryKeys.articleCorrections(articleId),
    queryFn: () => getCorrections({ articleId }),
    enabled: Boolean(articleId),
  });
}
