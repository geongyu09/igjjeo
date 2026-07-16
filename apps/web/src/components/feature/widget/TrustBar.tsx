import styles from "./TrustBar.module.css";

export interface TrustBarProps {
  /** 인정(admit) 반응 수 */
  admitCount: number;
  /** 진짜?(really) 반응 수 */
  reallyCount: number;
  /** 비율의 분모 — 생략하면 두 카운트의 합 */
  total?: number;
  className?: string;
}

type Verdict = "admit" | "really" | "tie";

const VERDICT_LABEL: Record<Verdict, string> = {
  admit: "인정 우세 · 사실로 굳는 중",
  really: "진짜? 우세 · 정정 신호",
  tie: "팽팽한 대치",
};

function getVerdict(admitCount: number, reallyCount: number): Verdict {
  if (admitCount > reallyCount) return "admit";
  if (reallyCount > admitCount) return "really";
  return "tie";
}

/**
 * 신뢰도 바 — 인정이 많으면 사실로 굳고, 진짜?가 많으면 정정 요청으로 유도.
 */
export function TrustBar({ admitCount, reallyCount, total, className }: TrustBarProps) {
  const base = Math.max(total ?? admitCount + reallyCount, 1);
  const verdict = getVerdict(admitCount, reallyCount);

  return (
    <div className={[styles.trustBar, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        <span>이 그룹의 판정</span>
        <span className={styles.verdict} data-verdict={verdict}>
          {VERDICT_LABEL[verdict]}
        </span>
      </div>
      <div className={styles.track} aria-hidden>
        <div
          className={styles.fill}
          data-part="admit"
          style={{ width: `${(admitCount / base) * 100}%` }}
        />
        <div
          className={styles.fill}
          data-part="really"
          style={{ width: `${(reallyCount / base) * 100}%` }}
        />
      </div>
      <div className={styles.counts}>
        <span>인정 {admitCount}</span>
        <span>진짜? {reallyCount}</span>
      </div>
    </div>
  );
}
