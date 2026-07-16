import { PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./PublisherWordmark.module.css";

export interface PublisherWordmarkProps {
  outlet: OutletKey;
  className?: string;
}

/**
 * 언론사 워드마크 — 무게·자간·기울기로 각 언론사의 성격을 드러낸다.
 * 크기는 부모의 font-size를 따른다.
 */
export function PublisherWordmark({ outlet, className }: PublisherWordmarkProps) {
  return (
    <span
      className={[styles.wordmark, className].filter(Boolean).join(" ")}
      data-outlet={outlet}
    >
      {PUBLISHERS[outlet].name}
    </span>
  );
}
