import { Clock3, Flame } from "lucide-react";
import styles from "./FeedMarker.module.css";

/** hot — 24시간 내 반응이 가장 뜨거운 톱기사 / fresh — 4시간 내 발행된 기사 */
export type FeedMarkerVariant = "hot" | "fresh";

export interface FeedMarkerProps {
  variant: FeedMarkerVariant;
  className?: string;
}

const MARKERS = {
  hot: { label: "오늘 가장 뜨거운", Icon: Flame },
  fresh: { label: "최신 뉴스", Icon: Clock3 },
} as const;

export function FeedMarker({ variant, className }: FeedMarkerProps) {
  const { label, Icon } = MARKERS[variant];

  return (
    <span
      className={[styles.marker, className].filter(Boolean).join(" ")}
      data-variant={variant}
    >
      <Icon size={12} aria-hidden />
      {label}
    </span>
  );
}
