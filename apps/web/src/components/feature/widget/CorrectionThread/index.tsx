import { CornerUpLeft } from "lucide-react";
import { Badge } from "@/components/common/shared/ui/Badge";
import type { OutletKey } from "@/lib/publishers";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import styles from "./CorrectionThread.module.css";

export type CorrectionKind = "original" | "correction" | "recorrection";

export interface CorrectionThreadItem {
  outlet: OutletKey;
  kind: CorrectionKind;
  headline: string;
  body?: string;
  /** 하단 모노 메타 ("원본 · 👀 12") */
  meta?: string;
}

export interface CorrectionThreadProps {
  items: CorrectionThreadItem[];
  className?: string;
}

const KIND_BADGE: Record<
  Exclude<CorrectionKind, "original">,
  { label: string; variant: "accent" | "accent-strong" }
> = {
  correction: { label: "정정", variant: "accent" },
  recorrection: { label: "재정정", variant: "accent-strong" },
};

/**
 * 정정보도 스레드 — 원본→정정→재정정이 한 줄기로 쌓인다.
 */
export function CorrectionThread({ items, className }: CorrectionThreadProps) {
  return (
    <ol className={[styles.thread, className].filter(Boolean).join(" ")}>
      {items.map((item, index) => (
        <li key={index} className={styles.node} data-kind={item.kind}>
          <div className={styles.head}>
            {item.kind !== "original" && (
              <CornerUpLeft
                size={13}
                className={styles.replyIcon}
                aria-hidden
              />
            )}
            <PublisherBadge outlet={item.outlet} />
            {item.kind !== "original" && (
              <Badge variant={KIND_BADGE[item.kind].variant}>
                {KIND_BADGE[item.kind].label}
              </Badge>
            )}
          </div>
          <h4 className={styles.headline}>{item.headline}</h4>
          {item.body && <p className={styles.body}>{item.body}</p>}
          {item.meta && <div className={styles.meta}>{item.meta}</div>}
        </li>
      ))}
    </ol>
  );
}
