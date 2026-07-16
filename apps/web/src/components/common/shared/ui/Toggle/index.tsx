"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./Toggle.module.css";

export interface ToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, onChange, className, ...rest }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={[styles.toggle, className].filter(Boolean).join(" ")}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      <span className={styles.knob} />
    </button>
  );
}
