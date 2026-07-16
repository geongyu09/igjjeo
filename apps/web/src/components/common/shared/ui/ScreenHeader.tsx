"use client";

import { ChevronLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ScreenHeader.module.css";

export type ScreenHeaderLeading = "back" | "close" | "none";

export interface ScreenHeaderProps {
  /** 중앙 타이틀 — 텍스트 또는 배지 등 노드 */
  title?: ReactNode;
  /** 좌측 요소 — 뒤로(chevron) / 닫기(X) / 없음 */
  leading?: ScreenHeaderLeading;
  /** 뒤로·닫기 클릭 핸들러 */
  onBack?: () => void;
  /** 우측 슬롯 */
  trailing?: ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  leading = "back",
  onBack,
  trailing,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={[styles.header, className].filter(Boolean).join(" ")}>
      <div className={styles.side}>
        {leading === "back" && (
          <button type="button" className={styles.iconButton} aria-label="뒤로" onClick={onBack}>
            <ChevronLeft size={22} aria-hidden />
          </button>
        )}
        {leading === "close" && (
          <button type="button" className={styles.iconButton} aria-label="닫기" onClick={onBack}>
            <X size={22} aria-hidden />
          </button>
        )}
      </div>
      <div className={styles.title}>{title}</div>
      <div className={[styles.side, styles.trailing].join(" ")}>{trailing}</div>
    </header>
  );
}
