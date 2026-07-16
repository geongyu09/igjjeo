import type { OutletKey } from "@/lib/publishers";
import { PublisherBadge } from "./PublisherBadge";
import styles from "./ArticlePreview.module.css";

export interface ArticlePreviewProps {
  outlet: OutletKey;
  /** 줄바꿈(\n) 허용 — pre-line으로 렌더 */
  headline: string;
  body: string;
  /** 하단 모노 메타 */
  byline: string;
  imageUrl?: string;
  className?: string;
}

/** 발행 확인(03) — 각색된 기사 전체 미리보기 카드 */
export function ArticlePreview({
  outlet,
  headline,
  body,
  byline,
  imageUrl,
  className,
}: ArticlePreviewProps) {
  return (
    <article className={[styles.card, className].filter(Boolean).join(" ")}>
      <PublisherBadge outlet={outlet} />
      <h3 className={styles.headline}>{headline}</h3>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 외부 저장소 이미지, 크기 미정 단계
        <img className={styles.photo} src={imageUrl} alt={headline} />
      ) : (
        <div className={styles.photoPlaceholder} aria-hidden>
          사진
        </div>
      )}
      <p className={styles.body}>{body}</p>
      <div className={styles.meta}>{byline}</div>
    </article>
  );
}
