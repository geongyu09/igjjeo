"use client";

import { useId, type TextareaHTMLAttributes } from "react";
import styles from "./TextArea.module.css";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  id,
  maxLength,
  value,
  className,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const errorId = `${textareaId}-error`;
  const showCount = maxLength !== undefined && typeof value === "string";

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={textareaId} data-error={error ? "" : undefined}>
        {label}
      </label>
      <textarea
        id={textareaId}
        className={styles.textarea}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {showCount && (
        <div className={styles.footer}>
          <span className={styles.count}>
            {value.length} / {maxLength}
          </span>
        </div>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
