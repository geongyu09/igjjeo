"use client";

import { ArrowUp, MoreHorizontal } from "lucide-react";
import { use, useState } from "react";
import { StackLink } from "stack-link";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { CommentThread } from "@/components/feature/widget/CommentThread";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { ReactionBar } from "@/components/feature/widget/ReactionBar";
import { TrustBar } from "@/components/feature/widget/TrustBar";
import { useStackBack } from "@/hooks/common/useStackBack";
import { ARTICLE_COMMENTS, FEED_ARTICLES, getArticle } from "@/lib/mock";
import type { ReactionType } from "@/lib/reactions";
import styles from "./page.module.css";

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const back = useStackBack();
  const article = getArticle(id) ?? FEED_ARTICLES[0];

  const [counts, setCounts] = useState(article.reactions);
  const [mine, setMine] = useState<ReactionType | null>(null);

  const react = (type: ReactionType) => {
    setCounts((prev) => {
      const next = { ...prev };
      if (mine) next[mine] -= 1;
      if (mine !== type) next[type] += 1;
      return next;
    });
    setMine((prev) => (prev === type ? null : type));
  };

  const header = (
    <ScreenHeader
      title={<PublisherBadge outlet={article.outlet} />}
      onBack={back}
      trailing={
        <button type="button" className={styles.moreButton} aria-label="더보기">
          <MoreHorizontal size={22} aria-hidden />
        </button>
      }
    />
  );

  const footer = (
    <div className={styles.composer}>
      <input
        className={styles.commentInput}
        placeholder="댓글 달기…"
        aria-label="댓글"
      />
      <button
        type="button"
        className={styles.sendButton}
        aria-label="댓글 보내기"
      >
        <ArrowUp size={19} aria-hidden />
      </button>
    </div>
  );

  return (
    <MobileScreen header={header} footer={footer}>
      <div className={styles.body}>
        <h1 className={styles.headline}>{article.headline}</h1>
        <div className={styles.byline}>{article.byline}</div>
        <div className={styles.photo} aria-hidden>
          사진
        </div>
        <p className={styles.article}>{article.body}</p>

        <TrustBar
          className={styles.trust}
          admitCount={counts.admit}
          reallyCount={counts.really}
          total={Math.max(counts.admit + counts.really, 10)}
        />

        <ReactionBar counts={counts} myReaction={mine} onReact={react} />

        <StackLink href={`/article/${id}/thread`} preLoad animation="slide">
          <button type="button" className={styles.correctionCta}>
            사실과 다르다면?{" "}
            <span className={styles.correctionLink}>정정 요청 →</span>
          </button>
        </StackLink>

        <div className={styles.comments}>
          <CommentThread comments={ARTICLE_COMMENTS} />
        </div>
      </div>
    </MobileScreen>
  );
}
