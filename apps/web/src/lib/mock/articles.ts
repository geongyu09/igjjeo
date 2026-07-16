/**
 * 기사·댓글·정정 스레드 목 데이터 — "지각 사건"을 중심으로 언론사별 각색을 보여준다.
 */

import type { CorrectionThreadItem } from "@/components/feature/widget/CorrectionThread";
import type { MockArticle, MockComment } from "./types";

/** 피드 — 톱기사(hero) 1 + 언론사별 카드가 시간순으로 섞여 흐른다. */
export const FEED_ARTICLES: MockArticle[] = [
  {
    id: "1",
    reportId: "r1",
    outlet: "shock",
    headline: "【단독】 상습 지각, 이대로 괜찮은가",
    excerpt: "충격. 또 늦었다. 벌써 세 번째. 조원들의 인내심이 한계에 다다랐다는 후문이다.",
    body: '충격. 또 늦었다. 벌써 세 번째. 조원들의 인내심이 한계에 다다랐다는 후문이다. 관계자는 "이번엔 다를 줄 알았다"며 말을 잇지 못했다.',
    byline: "특종 기자 · 오전 10:24 · 제보 김*규",
    reporterLabel: "김*규",
    timeLabel: "방금",
    viewCount: 12,
    commentCount: 5,
    reactions: { really: 2, shock: 5, admit: 7, scoop: 3 },
  },
  {
    id: "2",
    reportId: "r2",
    outlet: "economy",
    headline: "간식 예산 40% 삭감… 긴축 국면 진입",
    excerpt: "전주 대비 간식비가 40% 급감한 것으로 나타났다. 3조는 당분간 긴축 기조를 유지할 전망이다.",
    body: "전주 대비 간식비가 40% 급감한 것으로 나타났다. 3조는 당분간 긴축 기조를 유지할 전망이다. 전문가들은 이번 삭감이 회의 사기에 미칠 영향을 주시하고 있다.",
    byline: "경제 기자 · 1시간 · 제보 이*아",
    reporterLabel: "이*아",
    timeLabel: "1시간",
    viewCount: 7,
    commentCount: 2,
    reactions: { really: 1, shock: 1, admit: 4, scoop: 0 },
  },
  {
    id: "3",
    reportId: "r1",
    outlet: "science",
    headline: "'왜 늘 그 사람인가'… 지각의 상관관계 분석",
    excerpt: "표본 9명을 대상으로 한 관찰에서 특정 개체의 지각이 통계적으로 유의미하게 반복됐다.",
    body: "표본 9명을 대상으로 한 관찰에서 특정 개체의 지각이 통계적으로 유의미하게 반복됐다. 연구진은 추가 관찰이 필요하다고 밝혔다.",
    byline: "연구 기자 · 1시간 · 제보 김*규",
    reporterLabel: "김*규",
    timeLabel: "1시간",
    viewCount: 8,
    commentCount: 3,
    reactions: { really: 3, shock: 1, admit: 5, scoop: 1 },
  },
  {
    id: "4",
    reportId: "r3",
    outlet: "emotion",
    headline: "그날, 회의실엔 침묵만 흘렀다",
    excerpt: "비어 있던 그 자리를 오래 바라보았다. 누군가의 부재는 생각보다 큰 소리를 낸다.",
    body: "비어 있던 그 자리를 오래 바라보았다. 누군가의 부재는 생각보다 큰 소리를 낸다. 우리는 그 침묵 속에서 각자의 아침을 떠올렸다.",
    byline: "감성 기자 · 2시간 · 제보 이*아",
    reporterLabel: "이*아",
    timeLabel: "2시간",
    viewCount: 5,
    commentCount: 1,
    reactions: { really: 0, shock: 1, admit: 3, scoop: 0 },
  },
  {
    id: "5",
    reportId: "r1",
    outlet: "daily",
    headline: "김*규 씨, 오전 10시 12분 도착 확인",
    excerpt: "김*규 씨가 오전 10시 12분에 도착한 것으로 확인됐다.",
    body: "김*규 씨가 오전 10시 12분에 도착한 것으로 확인됐다. 예정 시각보다 12분 늦은 것으로 파악된다.",
    byline: "생활 기자 · 2시간 · 제보 김*규",
    reporterLabel: "김*규",
    timeLabel: "2시간",
    viewCount: 4,
    commentCount: 1,
    reactions: { really: 0, shock: 0, admit: 2, scoop: 0 },
  },
];

const ARTICLES_BY_ID: Record<string, MockArticle> = Object.fromEntries(
  FEED_ARTICLES.map((article) => [article.id, article]),
);

export function getArticle(id: string): MockArticle | undefined {
  return ARTICLES_BY_ID[id];
}

/** 기사 상세 댓글 (id "1" 기준) */
export const ARTICLE_COMMENTS: MockComment[] = [
  { id: "c1", authorLabel: "이*아", timeLabel: "방금", body: "데일리쇼크 왜 이래 ㅋㅋㅋ" },
  { id: "c2", authorLabel: "박*호", timeLabel: "2분", body: "이건 좀 과장인데 ㅋㅋ 근데 팩트임" },
];

/** 정정보도 연쇄 — 원본 → 정정 → 재정정 */
export const CORRECTION_THREAD: CorrectionThreadItem[] = [
  {
    outlet: "shock",
    kind: "original",
    headline: "【단독】 상습 지각, 이대로 괜찮은가",
    meta: "원본 · 👀 12 · 인정 7 / 진짜? 2",
  },
  {
    outlet: "daily",
    kind: "correction",
    headline: "본지는 앞선 보도를 정정합니다",
    body: "민규 씨는 지각한 것이 아니라, 애초에 참석하지 않은 것으로 확인됐다.",
    meta: "제3자 정정 · 👀 21",
  },
  {
    outlet: "shock",
    kind: "recorrection",
    headline: '【충격】 "안 왔다"는 주장마저 거짓이었나',
    body: "불참을 주장한 당사자가 실은 근처 카페에 있었다는 정황이 포착됐다.",
    meta: "제3자 정정 · 👀 34 · 특종 9",
  },
];

/**
 * 발행 확인(03) — 하나의 제보가 무작위 배정된 세 언론사로 각색된 결과.
 * 아직 DB 미저장 상태로 화면에만 표시.
 */
export const DRAFT_PREVIEW: MockArticle[] = [
  {
    id: "d-shock",
    reportId: "draft",
    outlet: "shock",
    headline: "【단독】 상습 지각,\n이대로 괜찮은가",
    excerpt: "충격. 또 늦었다. 벌써 세 번째.",
    body: '충격. 또 늦었다. 벌써 세 번째. 조원들의 인내심이 한계에 다다랐다는 후문이다. 관계자는 "이번엔 다를 줄 알았다"며 말을 잇지 못했다.',
    byline: "특종 기자 · 방금 · 제보 김*규",
    reporterLabel: "김*규",
    timeLabel: "방금",
    viewCount: 0,
    commentCount: 0,
    reactions: { really: 0, shock: 0, admit: 0, scoop: 0 },
  },
  {
    id: "d-science",
    reportId: "draft",
    outlet: "science",
    headline: "지각의 상관관계,\n표본 9명의 기록",
    excerpt: "특정 개체의 지각이 통계적으로 유의미하게 반복됐다.",
    body: "표본 9명을 대상으로 한 관찰에서 특정 개체의 지각이 통계적으로 유의미하게 반복됐다. 연구진은 추가 관찰이 필요하다고 밝혔다.",
    byline: "연구 기자 · 방금 · 제보 김*규",
    reporterLabel: "김*규",
    timeLabel: "방금",
    viewCount: 0,
    commentCount: 0,
    reactions: { really: 0, shock: 0, admit: 0, scoop: 0 },
  },
  {
    id: "d-emotion",
    reportId: "draft",
    outlet: "emotion",
    headline: "그날, 회의실엔\n침묵만 흘렀다",
    excerpt: "비어 있던 그 자리를 오래 바라보았다.",
    body: "비어 있던 그 자리를 오래 바라보았다. 누군가의 부재는 생각보다 큰 소리를 낸다. 우리는 그 침묵 속에서 각자의 아침을 떠올렸다.",
    byline: "감성 기자 · 방금 · 제보 김*규",
    reporterLabel: "김*규",
    timeLabel: "방금",
    viewCount: 0,
    commentCount: 0,
    reactions: { really: 0, shock: 0, admit: 0, scoop: 0 },
  },
];
