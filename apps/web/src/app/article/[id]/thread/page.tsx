"use client";

import { Flag, MoreHorizontal } from "lucide-react";
import { use } from "react";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import {
  CorrectionThread,
  type CorrectionKind,
  type CorrectionThreadItem,
} from "@/components/feature/widget/CorrectionThread";
import { useStackBack } from "@/hooks/common/useStackBack";
import { useArticleCorrectionsSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useArticleCorrectionsSuspenseQuery";
import type { Article } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/datetime";
import styles from "./page.module.css";

export default function CorrectionThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const back = useStackBack();

  const header = (
    <ScreenHeader
      title="정정 연쇄"
      onBack={back}
      trailing={
        <button type="button" className={styles.moreButton} aria-label="더보기">
          <MoreHorizontal size={22} aria-hidden />
        </button>
      }
    />
  );

  const footer = (
    <div className={styles.ctaBar}>
      <button type="button" className={styles.requestButton}>
        <Flag size={16} aria-hidden />
        나도 정정 요청
      </button>
    </div>
  );

  return (
    <MobileScreen header={header} footer={footer}>
      <QueryBoundary>
        <ThreadContent id={id} />
      </QueryBoundary>
    </MobileScreen>
  );
}

/** 정정 연쇄에서 각 기사의 원본/정정/재정정 종류를 판별한다. */
function correctionKind(
  article: Article,
  byId: Map<string, Article>,
): CorrectionKind {
  if (!article.is_correction) return "original";
  const target = article.corrects_article_id
    ? byId.get(article.corrects_article_id)
    : undefined;
  return target?.is_correction ? "recorrection" : "correction";
}

function ThreadContent({ id }: { id: string }) {
  const { data } = useArticleCorrectionsSuspenseQuery({ articleId: id });
  const articles = data.items;

  if (articles.length === 0) {
    return (
      <div className={styles.body}>
        <EmptyState
          icon={<Flag size={22} aria-hidden />}
          title="아직 정정 이력이 없어요"
          description="이 기사에 대한 정정 요청이 들어오면 여기 쌓여요."
        />
      </div>
    );
  }

  const byId = new Map(articles.map((article) => [article.id, article]));
  const items: CorrectionThreadItem[] = articles.map((article) => ({
    outlet: article.outlet_key,
    kind: correctionKind(article, byId),
    headline: article.headline,
    body: article.body,
    meta: formatRelativeTime(article.published_at),
  }));

  return (
    <div className={styles.body}>
      <CorrectionThread items={items} />
      <p className={styles.tail}>…이 사건, 아직 안 끝났습니다</p>
    </div>
  );
}
