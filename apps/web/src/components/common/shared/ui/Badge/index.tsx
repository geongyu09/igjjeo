import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "accent" | "accent-strong" | "neutral" | "success";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(" ")}
      data-variant={variant}
      {...rest}
    />
  );
}
