import { PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./PublisherBadge.module.css";

export type PublisherBadgeVariant = "soft" | "solid" | "text";

export interface PublisherBadgeProps {
  outlet: OutletKey;
  variant?: PublisherBadgeVariant;
  className?: string;
}

export function PublisherBadge({ outlet, variant = "soft", className }: PublisherBadgeProps) {
  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(" ")}
      data-outlet={outlet}
      data-variant={variant}
    >
      {PUBLISHERS[outlet].name}
    </span>
  );
}
