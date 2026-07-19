"use client";

import { Check } from "lucide-react";
import { OUTLET_KEYS, PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./PublisherCheckGroup.module.css";

export interface PublisherCheckGroupProps {
  /** 노출할 언론사 — 기본은 5곳 전부 */
  outlets?: readonly OutletKey[];
  /** 현재 선택된 언론사 목록 */
  value: OutletKey[];
  /** 고를 수 있는 최대 개수 — 미지정이면 제한 없음 */
  max?: number;
  onChange: (next: OutletKey[]) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * 제보자가 기사를 낼 언론사를 직접 고르는 복수 선택 목록 (02 제보하기).
 * 최소 1곳 규칙은 소비하는 화면에서 강제한다 — 이 위젯은 controlled 선택과
 * 최대 개수(max) 도달 시 미선택 항목 비활성화만 담당.
 */
export function PublisherCheckGroup({
  outlets = OUTLET_KEYS,
  value,
  max,
  onChange,
  className,
  ...rest
}: PublisherCheckGroupProps) {
  const selected = new Set(value);
  const reachedMax = max !== undefined && selected.size >= max;

  const toggle = (outlet: OutletKey) => {
    const next = new Set(selected);
    if (next.has(outlet)) {
      next.delete(outlet);
    } else {
      if (reachedMax) return;
      next.add(outlet);
    }
    // 표시 순서를 유지해 반환한다.
    onChange(outlets.filter((key) => next.has(key)));
  };

  return (
    <div
      role="group"
      className={[styles.group, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {outlets.map((outlet) => {
        const isSelected = selected.has(outlet);
        const publisher = PUBLISHERS[outlet];
        return (
          <button
            key={outlet}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            className={styles.option}
            data-outlet={outlet}
            disabled={reachedMax && !isSelected}
            onClick={() => toggle(outlet)}
          >
            <span className={styles.box}>
              {isSelected && <Check size={13} strokeWidth={3} aria-hidden />}
            </span>
            <span className={styles.info}>
              <span className={styles.name}>{publisher.name}</span>
              <span className={styles.tagline}>{publisher.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
