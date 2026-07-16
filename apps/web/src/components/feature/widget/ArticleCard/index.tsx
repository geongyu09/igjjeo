"use client";

import { Eye, MessageCircle } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { PUBLISHERS, type OutletKey } from "@/lib/publishers";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import styles from "./ArticleCard.module.css";

export type ArticleCardVariant = "large" | "hero" | "list" | "compact";

export interface ArticleCardProps {
  variant?: ArticleCardVariant;
  outlet: OutletKey;
  headline: string;
  /** 본문 발췌 — large에서만 노출 */
  excerpt?: string;
  /** 사진 URL — 없으면 플레이스홀더 패턴 (compact은 사진 영역 없음) */
  imageUrl?: string;
  /** large에서 사진 영역 자체를 생략 (텍스트 전용 카드) */
  hidePhoto?: boolean;
  viewCount?: number;
  commentCount?: number;
  /** 제보자 마스킹 이름 ("김*규") */
  reporterLabel?: string;
  /** 상대 시각 라벨 ("방금", "1시간") — list·compact 메타에 노출 */
  timeLabel?: string;
  /** hero 상단 배지 슬롯 */
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
}

function Photo({
  imageUrl,
  headline,
  small,
}: {
  imageUrl?: string;
  headline: string;
  small?: boolean;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- 외부 저장소(Supabase Storage) 이미지, 크기 미정 단계
    return (
      <img
        className={small ? styles.thumb : styles.photo}
        src={imageUrl}
        alt={headline}
      />
    );
  }
  return (
    <div
      className={small ? styles.thumbPlaceholder : styles.photoPlaceholder}
      aria-hidden
    >
      {!small && "사진"}
    </div>
  );
}

export function ArticleCard({
  variant = "large",
  outlet,
  headline,
  excerpt,
  imageUrl,
  hidePhoto = false,
  viewCount,
  commentCount,
  reporterLabel,
  timeLabel,
  badge,
  onClick,
  className,
}: ArticleCardProps) {
  const publisherName = PUBLISHERS[outlet].name;
  const rootClassName = [styles.card, className].filter(Boolean).join(" ");
  // 카드 전체가 클릭 타깃일 때 키보드(Enter/Space)로도 조작 가능해야 한다
  const interactiveProps = onClick
    ? {
        onClick,
        tabIndex: 0,
        "data-interactive": "",
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};

  if (variant === "hero") {
    return (
      <article
        className={rootClassName}
        data-variant="hero"
        {...interactiveProps}
      >
        <Photo imageUrl={imageUrl} headline={headline} />
        <div className={styles.heroBody}>
          {badge}
          <h3 className={styles.heroHeadline}>{headline}</h3>
          <div className={styles.monoMeta}>
            {publisherName} · 👀 {viewCount ?? 0}
            {reporterLabel && <> · 제보 {reporterLabel}</>}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article
        className={rootClassName}
        data-variant="list"
        {...interactiveProps}
      >
        <div className={styles.listBody}>
          <PublisherBadge outlet={outlet} variant="text" />
          <h3 className={styles.listHeadline}>{headline}</h3>
          <div className={styles.monoMeta}>
            👀 {viewCount ?? 0} · 댓글 {commentCount ?? 0}
            {timeLabel && <> · {timeLabel}</>}
          </div>
        </div>
        <Photo imageUrl={imageUrl} headline={headline} small />
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article
        className={rootClassName}
        data-variant="compact"
        {...interactiveProps}
      >
        <PublisherBadge outlet={outlet} variant="text" />
        <h3 className={styles.listHeadline}>{headline}</h3>
        <div className={styles.monoMeta}>
          👀 {viewCount ?? 0} · 댓글 {commentCount ?? 0}
          {timeLabel && <> · {timeLabel}</>}
        </div>
      </article>
    );
  }

  return (
    <article
      className={rootClassName}
      data-variant="large"
      {...interactiveProps}
    >
      <PublisherBadge outlet={outlet} />
      <h3 className={styles.largeHeadline}>{headline}</h3>
      {!hidePhoto && <Photo imageUrl={imageUrl} headline={headline} />}
      {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
      <div className={styles.footer}>
        <span className={styles.stat}>
          <Eye size={15} aria-hidden />
          {viewCount ?? 0}
        </span>
        <span className={styles.stat}>
          <MessageCircle size={15} aria-hidden />
          {commentCount ?? 0}
        </span>
        {reporterLabel && (
          <span className={styles.reporter}>제보 {reporterLabel}</span>
        )}
      </div>
    </article>
  );
}
