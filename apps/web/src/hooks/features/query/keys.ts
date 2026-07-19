/**
 * React Query 쿼리 키 팩토리.
 * 키는 데이터 접근 경로와 일치시키고, 방(그룹) 단위 격리를 위해 groupId 등 식별자를 포함한다.
 * mutation의 무효화(invalidateQueries)도 이 팩토리를 참조해 일관성을 유지한다.
 */

export const queryKeys = {
  me: () => ["me"] as const,
  /** 방 안에서의 내 프로필 요약(통계·내 제보) */
  memberProfile: (groupId: string) => ["me", "profile", groupId] as const,

  groups: () => ["groups"] as const,
  group: (groupId: string) => ["groups", groupId] as const,
  groupMembers: (groupId: string) => ["groups", groupId, "members"] as const,
  feed: (groupId: string) => ["groups", groupId, "feed"] as const,
  /** 날짜별 프롬프트 전체를 prefix로 묶는 무효화용 스코프 키 */
  dailyPromptScope: (groupId: string) =>
    ["groups", groupId, "daily-prompt"] as const,
  dailyPrompt: (groupId: string, date?: string) =>
    ["groups", groupId, "daily-prompt", date ?? "today"] as const,

  article: (articleId: string) => ["articles", articleId] as const,
  articleComments: (articleId: string) =>
    ["articles", articleId, "comments"] as const,
  articleCorrections: (articleId: string) =>
    ["articles", articleId, "corrections"] as const,

  reportDraft: (reportId: string) => ["reports", reportId, "draft"] as const,
  /** 오늘 제보 한도 사용 현황(사용자 전역) */
  reportQuota: () => ["reports", "quota"] as const,
};
