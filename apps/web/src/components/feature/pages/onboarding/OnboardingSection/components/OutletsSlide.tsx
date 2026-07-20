import { Quote } from "lucide-react";

import { type OutletKey, PUBLISHERS } from "@/lib/publishers";

import styles from "./OutletsSlide.module.css";

/** 같은 제보가 언론사별로 어떻게 달라지는지 보여주는 예시 — 온보딩 설명 전용 문구다. */
const SAMPLES: { key: OutletKey; tone: string; headline: string }[] = [
  { key: "daily", tone: "담담하게", headline: "김*규 씨, 오전 10시 12분 도착" },
  {
    key: "shock",
    tone: "자극적으로 과장",
    headline: "【충격】 상습 지각, 이대로 괜찮은가",
  },
  {
    key: "science",
    tone: "엉뚱한 학술 발표",
    headline: "지각의 진짜 범인은 '이불 자석'이었다",
  },
  {
    key: "emotion",
    tone: "감성 에세이처럼",
    headline: "그가 늦은 아침, 창밖엔 비가 내렸다",
  },
  {
    key: "praise",
    tone: "손발 오그라드는 극찬",
    headline: "마침내 도착, 그 성실함에 모두가 박수쳤다",
  },
];

/** 03 다섯 언론사 — 같은 일도 다섯 개의 기사로. */
export function OutletsSlide() {
  return (
    <div className={styles.slide}>
      <h1 className={styles.title}>
        같은 일도,
        <br />
        다섯 개의 기사로
      </h1>

      <div className={styles.quote}>
        <Quote size={15} aria-hidden className={styles.quoteIcon} />
        <span>
          제보 — <b>&ldquo;민규가 오늘도 지각했어요&rdquo;</b>
        </span>
      </div>

      <ul className={styles.list}>
        {SAMPLES.map(({ key, tone, headline }) => (
          <li key={key} className={styles.card} data-outlet={key}>
            <div className={styles.cardHead}>
              <span className={styles.outletName}>{PUBLISHERS[key].name}</span>
              <span className={styles.tone}>{tone}</span>
            </div>
            <div className={styles.headline}>{headline}</div>
          </li>
        ))}
      </ul>

      <p className={styles.note}>제보할 때 원하는 곳을 직접 골라요</p>
    </div>
  );
}
