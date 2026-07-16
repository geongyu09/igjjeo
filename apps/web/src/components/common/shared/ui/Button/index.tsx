"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 완전한 원형/알약 형태 (FAB 등) */
  pill?: boolean;
  /** 정사각 아이콘 버튼 — aria-label 필수 */
  iconOnly?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  iconOnly = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-size={size}
      data-pill={pill ? "" : undefined}
      data-icon-only={iconOnly ? "" : undefined}
      {...rest}
    />
  );
}
