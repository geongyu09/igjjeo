import styles from "./LoadingScreen.module.css";

export interface LoadingScreenProps {
  /** 스크린 리더용 로딩 안내 문구 */
  label?: string;
  className?: string;
}

/** Suspense fallback — 데이터 로딩 중 화면 중앙에 스피너를 그린다. */
export function LoadingScreen({
  label = "불러오는 중",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} aria-hidden />
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}
