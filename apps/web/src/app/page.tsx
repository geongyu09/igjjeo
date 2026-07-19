"use client";

import { Flame, MessageCircle, Newspaper, Search, Share2 } from "lucide-react";
import { Button } from "@/components/common/shared/ui/Button";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { useSession } from "@/components/common/shared/SessionProvider";
import { ArticleCard } from "@/components/feature/widget/ArticleCard";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { useOpenScreen } from "@/hooks/common/useOpenScreen";
import { useReplaceScreen } from "@/hooks/common/useReplaceScreen";
import { useRefreshFeed } from "@/hooks/features/feed/useRefreshFeed";
import { useCopyInviteLink } from "@/hooks/features/group/useCopyInviteLink";
import { useFeedSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useFeedSuspenseQuery";
import { formatRelativeTime } from "@/lib/datetime";
import { pressable } from "@/lib/interactive";
import styles from "./page.module.css";

export default function FeedPage() {
  const { groups, activeGroupId } = useSession();
  const replaceScreen = useReplaceScreen();
  const refreshFeed = useRefreshFeed({ groupId: activeGroupId ?? "" });
  const copyInviteLink = useCopyInviteLink();
  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? null;

  const header = (
    <div className={styles.appHeader}>
      <button
        type="button"
        className={styles.roomInfo}
        onClick={() => replaceScreen("/group")}
      >
        {activeGroup ? (
          <>
            <span className={styles.roomName}>{activeGroup.name}</span>
            <span className={styles.roomCount}>
              {activeGroup.member_count}명
            </span>
          </>
        ) : (
          <span className={styles.roomName}>방을 만들어 보세요</span>
        )}
      </button>
      <div className={styles.headerActions}>
        <button type="button" className={styles.iconButton} aria-label="검색">
          <Search size={18} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="방 공유"
          disabled={!activeGroup}
          onClick={
            activeGroup
              ? () => copyInviteLink(activeGroup.invite_code)
              : undefined
          }
        >
          <Share2 size={18} aria-hidden />
        </button>
      </div>
    </div>
  );

  return (
    <MobileScreen
      header={header}
      onRefresh={activeGroupId ? refreshFeed : undefined}
    >
      {activeGroupId ? (
        <QueryBoundary>
          <FeedList groupId={activeGroupId} />
        </QueryBoundary>
      ) : (
        <EmptyState
          className={styles.empty}
          icon={<Newspaper size={22} aria-hidden />}
          title="아직 참여한 방이 없어요"
          description="방을 만들거나 초대 코드로 참여하면 이곳에 기사가 발행돼요."
          action={
            <Button onClick={() => replaceScreen("/group")}>방 고르기</Button>
          }
        />
      )}
    </MobileScreen>
  );
}

function FeedList({ groupId }: { groupId: string }) {
  const openScreen = useOpenScreen();
  const open = (id: string) => openScreen(`/article/${id}`);
  const { data } = useFeedSuspenseQuery({ groupId });

  // 제보 묶음(FeedBundle)을 펼쳐 기사 단위 목록으로 만들고, 제보자 라벨을 함께 실어 둔다.
  const items = data.pages
    .flatMap((page) => page.items)
    .flatMap((bundle) =>
      bundle.articles.map((article) => ({
        article,
        reporterLabel: bundle.reporter.masked_name,
      })),
    );

  if (items.length === 0) {
    return (
      <EmptyState
        className={styles.empty}
        icon={<Newspaper size={22} aria-hidden />}
        title="아직 기사가 없어요"
        description="첫 제보를 올리면 세 언론사가 각색한 기사가 여기 실려요."
      />
    );
  }

  const [hero, ...rest] = items;
  const largeCards = rest.slice(0, 3);
  const compactCards = rest.slice(3);

  return (
    <div className={styles.feed}>
      <article
        className={styles.hero}
        data-outlet={hero.article.outlet_key}
        {...pressable(() => open(hero.article.id))}
      >
        <div className={styles.heroPhoto} aria-hidden>
          사진
          <span className={styles.hotBadge}>
            <Flame size={12} aria-hidden />
            오늘 가장 뜨거운
          </span>
        </div>
        <div className={styles.heroBody}>
          <PublisherBadge outlet={hero.article.outlet_key} />
          <h2 className={styles.heroHeadline}>{hero.article.headline}</h2>
          <p className={styles.heroExcerpt}>{hero.article.excerpt}</p>
          <div className={styles.heroFooter}>
            <span className={styles.stat}>
              <MessageCircle size={15} aria-hidden />
              {hero.article.comment_count}
            </span>
            <span className={styles.reporter}>제보 {hero.reporterLabel}</span>
          </div>
        </div>
      </article>

      {largeCards.map(({ article, reporterLabel }) => (
        <ArticleCard
          key={article.id}
          variant="large"
          hidePhoto
          outlet={article.outlet_key}
          headline={article.headline}
          excerpt={article.excerpt}
          commentCount={article.comment_count}
          reporterLabel={reporterLabel}
          onClick={() => open(article.id)}
        />
      ))}

      {compactCards.map(({ article }) => (
        <ArticleCard
          key={article.id}
          variant="compact"
          outlet={article.outlet_key}
          headline={article.headline}
          commentCount={article.comment_count}
          timeLabel={formatRelativeTime(article.published_at)}
          onClick={() => open(article.id)}
        />
      ))}
    </div>
  );
}
