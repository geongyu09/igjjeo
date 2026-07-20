"use client";

import { Flag } from "lucide-react";
import { use } from "react";
import { BlockingOverlay } from "@/components/common/shared/ui/BlockingOverlay";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { CorrectionRequestSheet } from "@/components/feature/widget/CorrectionRequestSheet";
import {
  CorrectionThread,
  type CorrectionKind,
  type CorrectionThreadItem,
} from "@/components/feature/widget/CorrectionThread";
import { useStackBack } from "@/hooks/common/useStackBack";
import { useCorrectionRequest } from "@/hooks/features/article/useCorrectionRequest";
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
  const correction = useCorrectionRequest({ articleId: id });

  const header = <ScreenHeader title="정정 연쇄" onBack={back} />;

  const footer = (
    <div className={styles.ctaBar}>
      <button
        type="button"
        className={styles.requestButton}
        onClick={correction.open}
      >
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

      <CorrectionRequestSheet
        open={correction.isOpen}
        pending={correction.isPending}
        errorMessage={correction.errorMessage}
        onSubmit={correction.submit}
        onClose={correction.close}
      />
      <BlockingOverlay
        open={correction.isPending}
        message="정정 기사를 쓰는 중이에요"
        description="언론사가 정정 보도를 준비하고 있어요."
      />
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

  // 연쇄는 최초 기사부터 내려오므로 길이 1은 "원본만 있고 정정은 아직 없음"이다.
  if (articles.length <= 1) {
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
