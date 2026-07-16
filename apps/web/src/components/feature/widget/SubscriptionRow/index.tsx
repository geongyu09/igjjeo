import { Toggle } from "@/components/common/shared/ui/Toggle";
import { PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./SubscriptionRow.module.css";

export interface SubscriptionRowProps {
  outlet: OutletKey;
  subscribed: boolean;
  onChange: (subscribed: boolean) => void;
  className?: string;
}

/** 언론사 한 줄 + 구독 토글 (06 언론사 구독) */
export function SubscriptionRow({
  outlet,
  subscribed,
  onChange,
  className,
}: SubscriptionRowProps) {
  const publisher = PUBLISHERS[outlet];
  return (
    <div
      className={[styles.row, className].filter(Boolean).join(" ")}
      data-outlet={outlet}
      data-subscribed={subscribed ? "" : undefined}
    >
      <div className={styles.info}>
        <span className={styles.name}>{publisher.name}</span>
        <span className={styles.tagline}>{publisher.tagline}</span>
      </div>
      <Toggle
        checked={subscribed}
        onChange={onChange}
        aria-label={`${publisher.name} 구독`}
      />
    </div>
  );
}
