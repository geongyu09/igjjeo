import { useSuspenseQuery } from "@tanstack/react-query";
import { getDailyPrompt } from "@/lib/data/dailyPrompts";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseDailyPromptSuspenseQueryProps {
  groupId: string;
  /** YYYY-MM-DD (미지정 시 오늘) */
  date?: string;
}

/** 오늘(또는 지정일)의 데일리 프롬프트 (GET /groups/{groupId}/daily-prompt). 없으면 data=null. */
export function useDailyPromptSuspenseQuery({
  groupId,
  date,
}: UseDailyPromptSuspenseQueryProps) {
  return useSuspenseQuery({
    queryKey: queryKeys.dailyPrompt(groupId, date),
    queryFn: () => getDailyPrompt({ groupId, date }),
  });
}
