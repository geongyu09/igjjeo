import { useQuery } from "@tanstack/react-query";
import { getDailyPrompt } from "@/lib/data/dailyPrompts";
import { queryKeys } from "@/hooks/features/query/keys";

interface UseDailyPromptQueryProps {
  groupId: string;
  /** YYYY-MM-DD (미지정 시 오늘) */
  date?: string;
}

/** 오늘(또는 지정일)의 데일리 프롬프트 (GET /groups/{groupId}/daily-prompt). 없으면 data=null. */
export function useDailyPromptQuery({
  groupId,
  date,
}: UseDailyPromptQueryProps) {
  return useQuery({
    queryKey: queryKeys.dailyPrompt(groupId, date),
    queryFn: () => getDailyPrompt({ groupId, date }),
    enabled: Boolean(groupId),
  });
}
