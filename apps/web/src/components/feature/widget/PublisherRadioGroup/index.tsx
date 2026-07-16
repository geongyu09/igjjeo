"use client";

import type { KeyboardEvent } from "react";
import { MVP_OUTLETS, PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./PublisherRadioGroup.module.css";

export interface PublisherRadioGroupProps {
  /** 노출할 언론사 — 기본은 MVP 세 곳 */
  outlets?: OutletKey[];
  value: OutletKey | null;
  onChange: (outlet: OutletKey) => void;
  "aria-label"?: string;
  className?: string;
}

export function PublisherRadioGroup({
  outlets = MVP_OUTLETS,
  value,
  onChange,
  className,
  ...rest
}: PublisherRadioGroupProps) {
  const selectedIndex = value ? outlets.indexOf(value) : -1;
  const tabStopIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offset =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (offset === 0) return;
    event.preventDefault();
    const next = (tabStopIndex + offset + outlets.length) % outlets.length;
    onChange(outlets[next]);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      className={[styles.group, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {outlets.map((outlet, index) => {
        const selected = outlet === value;
        return (
          <button
            key={outlet}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabStopIndex ? 0 : -1}
            className={styles.option}
            data-outlet={outlet}
            onClick={() => onChange(outlet)}
            onKeyDown={handleKeyDown}
          >
            <span className={styles.circle}>
              {selected && <span className={styles.dot} />}
            </span>
            <span className={styles.name}>{PUBLISHERS[outlet].name}</span>
          </button>
        );
      })}
    </div>
  );
}
