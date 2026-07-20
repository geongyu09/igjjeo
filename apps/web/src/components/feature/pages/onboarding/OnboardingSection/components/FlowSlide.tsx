import { Sparkles } from "lucide-react";

import { PUBLISHERS } from "@/lib/publishers";

import styles from "./FlowSlide.module.css";

/** 02 흐름 — 제보 한 줄이 기사가 되기까지 3단계. */
export function FlowSlide() {
  return (
    <div className={styles.slide}>
      <h1 className={styles.title}>
        한 줄만 쓰면,
        <br />
        기사가 돼요
      </h1>
      <p className={styles.lead}>쓰는 건 짧은 몇 줄. 나머지는 AI가 합니다.</p>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <div className={styles.rail} aria-hidden>
            <span className={styles.marker}>1</span>
            <span className={styles.line} />
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>제보한다</div>
            <div className={styles.stepDesc}>모임에서 있었던 일을 한 줄로</div>
            <div className={styles.reportBox}>
              민규가 오늘도 지각했어요. 세 번째입니다.
            </div>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.rail} aria-hidden>
            <span className={styles.marker}>2</span>
            <span className={styles.line} />
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>AI가 각색한다</div>
            <div className={styles.stepDesc}>
              고른 언론사의 논조로 기사를 씀
            </div>
            <div className={styles.aiBox}>
              <Sparkles size={17} aria-hidden className={styles.aiIcon} />
              <span>언론사별 시각으로 다시 쓰는 중…</span>
            </div>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.rail} aria-hidden>
            <span className={styles.marker} data-accent="">
              3
            </span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>기사가 발행된다</div>
            <div className={styles.stepDesc}>피드에 카드로 올라옴</div>
            <div className={styles.articleCard} data-outlet="shock">
              <span className={styles.outletBadge}>
                {PUBLISHERS.shock.name}
              </span>
              <div className={styles.headline}>
                【충격】 상습 지각, 이대로 괜찮은가
              </div>
              <div className={styles.byline}>특종 기자 · 방금 · 제보 김*규</div>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}
