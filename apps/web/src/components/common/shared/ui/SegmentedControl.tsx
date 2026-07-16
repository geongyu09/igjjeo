"use client";

import type { KeyboardEvent } from "react";
import styles from "./SegmentedControl.module.css";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex((option) => option.value === value);
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
    const next = (tabStopIndex + offset + options.length) % options.length;
    onChange(options[next].value);
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
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={index === tabStopIndex ? 0 : -1}
          className={styles.item}
          onClick={() => onChange(option.value)}
          onKeyDown={handleKeyDown}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
