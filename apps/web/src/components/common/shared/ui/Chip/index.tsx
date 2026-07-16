"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./Chip.module.css";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** 점선 테두리 — "직접 추가" 등 행동 유도용 */
  dashed?: boolean;
}

export function Chip({
  selected = false,
  dashed = false,
  type = "button",
  className,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      className={[styles.chip, className].filter(Boolean).join(" ")}
      aria-pressed={selected}
      data-dashed={dashed ? "" : undefined}
      {...rest}
    />
  );
}
