"use client";

import { Eye, Flame, MessageCircle, Search } from "lucide-react";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ArticleCard } from "@/components/feature/widget/ArticleCard";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { useOpenScreen } from "@/hooks/common/useOpenScreen";
import { FEED_ARTICLES } from "@/lib/mock";
import { pressable } from "@/lib/interactive";
import styles from "./page.module.css";

export default function FeedPage() {
  const openScreen = useOpenScreen();
  const open = (id: string) => openScreen(`/article/${id}`);

  const hero = FEED_ARTICLES.find((a) => a.id === "1")!;
  const largeCards = FEED_ARTICLES.filter((a) =>
    ["2", "3", "4"].includes(a.id),
  );
  const compact = FEED_ARTICLES.find((a) => a.id === "5")!;

  const header = (
    <div className={styles.appHeader}>
      <div>
        <div className={styles.appTitle}>이거 진짜에요?</div>
        <div className={styles.appSub}>3조 뉴스룸 · 9명</div>
      </div>
      <div className={styles.headerActions}>
        <button type="button" className={styles.iconButton} aria-label="검색">
          <Search size={18} aria-hidden />
        </button>
        <Avatar name="나" emphasized />
      </div>
    </div>
  );

  return (
    <MobileScreen header={header}>
      <div className={styles.feed}>
        <article
          className={styles.hero}
          data-outlet="shock"
          {...pressable(() => open(hero.id))}
        >
          <div className={styles.heroPhoto} aria-hidden>
            사진
            <span className={styles.hotBadge}>
              <Flame size={12} aria-hidden />
              오늘 가장 뜨거운
            </span>
          </div>
          <div className={styles.heroBody}>
            <PublisherBadge outlet="shock" />
            <h2 className={styles.heroHeadline}>{hero.headline}</h2>
            <p className={styles.heroExcerpt}>{hero.excerpt}</p>
            <div className={styles.heroFooter}>
              <span className={styles.stat}>
                <Eye size={15} aria-hidden />
                {hero.viewCount}
              </span>
              <span className={styles.stat}>
                <MessageCircle size={15} aria-hidden />
                {hero.commentCount}
              </span>
              <span className={styles.reporter}>제보 {hero.reporterLabel}</span>
            </div>
          </div>
        </article>

        {largeCards.map((article) => (
          <ArticleCard
            key={article.id}
            variant="large"
            hidePhoto
            outlet={article.outlet}
            headline={article.headline}
            excerpt={article.excerpt}
            viewCount={article.viewCount}
            commentCount={article.commentCount}
            reporterLabel={article.reporterLabel}
            onClick={() => open(article.id)}
          />
        ))}

        <ArticleCard
          variant="compact"
          outlet={compact.outlet}
          headline={compact.headline}
          viewCount={compact.viewCount}
          commentCount={compact.commentCount}
          timeLabel={compact.timeLabel}
          onClick={() => open(compact.id)}
        />
      </div>
    </MobileScreen>
  );
}
