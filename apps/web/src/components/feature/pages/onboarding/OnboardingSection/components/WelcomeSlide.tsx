import { Newspaper } from "lucide-react";

import styles from "./WelcomeSlide.module.css";

/** 01 웰컴 — 서비스가 무엇인지 한 문장으로. */
export function WelcomeSlide() {
  return (
    <div className={styles.slide}>
      <span className={styles.logo} aria-hidden>
        <Newspaper size={38} />
      </span>

      <div>
        <div className={styles.eyebrow}>우리 소모임 전용 뉴스룸</div>
        <h1 className={styles.title}>이거 진짜예요?</h1>
        <span className={styles.rule} aria-hidden />
        <p className={styles.subtitle}>사소한 일이 뉴스가 되는 곳</p>
      </div>

      <p className={styles.lead}>
        모임에서 일어난 작은 일을 <b>한 줄로 제보</b>하면, AI가{" "}
        <b>여러 언론사의 시각</b>으로 각색해 기사로 발행해요. 매일 새로운
        대화거리가 저절로 생깁니다.
      </p>
    </div>
  );
}
