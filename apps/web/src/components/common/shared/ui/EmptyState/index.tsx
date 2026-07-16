import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  /** 상단 원 안에 들어갈 아이콘 */
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** 하단 행동 유도 요소 (버튼 등) */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={[styles.emptyState, className].filter(Boolean).join(" ")}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
