"use client";

import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

/** 이 시간을 넘기면 "느리다"고 보고 사용자에게 상태를 알린다. */
const DEFAULT_SLOW_AFTER_MS = 5_000;

export interface LoadingScreenProps {
  /** 스크린 리더용 로딩 안내 문구 */
  label?: string;
  /** 지연 안내를 띄우기까지의 시간(ms) */
  slowAfterMs?: number;
  className?: string;
}

/**
 * Suspense fallback — 데이터 로딩 중 화면 중앙에 스피너를 그린다.
 *
 * 로딩이 길어지면 안내 문구를 덧붙인다. 스피너만 도는 화면은 "기다리는 중"과 "멈춘 것"이
 * 구분되지 않아, 사용자는 앱이 죽었다고 느낀다.
 */
export function LoadingScreen({
  label = "불러오는 중",
  slowAfterMs = DEFAULT_SLOW_AFTER_MS,
  className,
}: LoadingScreenProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), slowAfterMs);
    return () => clearTimeout(timer);
  }, [slowAfterMs]);

  return (
    <div
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} aria-hidden />
      <span className={styles.srOnly}>{label}</span>
      {isSlow && (
        <p
          className={`t-body-s ${styles.slowHint}`}
          data-testid="loading-slow-hint"
        >
          {label}이에요. 조금만 기다려 주세요.
        </p>
      )}
    </div>
  );
}
