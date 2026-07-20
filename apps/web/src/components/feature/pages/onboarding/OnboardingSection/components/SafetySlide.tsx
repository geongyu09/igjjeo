import { Ban, Eye, HeartHandshake, Shield, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./SafetySlide.module.css";

const GUARDS: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <Shield size={19} />,
    title: "과한 표현은 언론사 몫이에요",
    description:
      "자극적인 문장은 데일리쇼크의 말투일 뿐, 제보한 당신의 말이 되지 않아요.",
  },
  {
    icon: <Eye size={19} />,
    title: "이름은 늘 가려서 보여줘요",
    description:
      "등장 인물도 제보자도 “김*규”처럼 가운데를 가려, 우리끼리만 통하는 농담으로 남아요.",
  },
  {
    icon: <Trash2 size={19} />,
    title: "불편하면 바로 내릴 수 있어요",
    description:
      "기사 속 당사자가 원하면 이유를 설명하지 않아도 즉시 사라져요. 마지막 결정권은 늘 본인에게 있어요.",
  },
  {
    icon: <Ban size={19} />,
    title: "선을 넘는 소재는 기사로 안 나가요",
    description:
      "가벼운 실수는 유쾌하게 부풀리지만, 외모·능력처럼 사람을 깎아내리는 제보는 AI가 각색을 거부해요.",
  },
];

/** 04 안전장치 — "놀리되 깎아내리지 않는다"를 약속하고 뉴스룸으로 보낸다. */
export function SafetySlide() {
  return (
    <div className={styles.slide}>
      <h1 className={styles.title}>
        웃자고 하는 일,
        <br />
        다치는 사람은 없게
      </h1>
      <p className={styles.lead}>
        재미와 상처는 종이 한 장 차이라서, 누구도 상처받지 않도록 안전장치 네
        가지를 미리 넣어뒀어요.
      </p>

      <ul className={styles.guards}>
        {GUARDS.map(({ icon, title, description }) => (
          <li key={title} className={styles.guard}>
            <span className={styles.guardIcon} aria-hidden>
              {icon}
            </span>
            <div>
              <div className={styles.guardTitle}>{title}</div>
              <div className={styles.guardDesc}>{description}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.pledge}>
        <HeartHandshake size={17} aria-hidden className={styles.pledgeIcon} />
        <p className={styles.pledgeText}>
          모두가 편하게 웃으려면 <b>서로가 등장인물이자 독자</b>라는 걸
          기억해요. 내가 웃을 수 있는 선까지만 놀리면 돼요.
        </p>
      </div>
    </div>
  );
}
