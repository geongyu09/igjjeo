import styles from "./ProgressDots.module.css";

export interface ProgressDotsProps {
  /** 0-based 현재 장 */
  current: number;
  total: number;
}

/** 온보딩 진행 표시 — 현재 장만 길쭉한 막대로 강조한다. */
export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div
      className={styles.dots}
      role="progressbar"
      aria-label="온보딩 진행"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={styles.dot}
          data-active={index === current ? "" : undefined}
        />
      ))}
    </div>
  );
}
