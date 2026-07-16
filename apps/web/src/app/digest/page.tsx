"use client";

import { Newspaper, PenLine, Trophy } from "lucide-react";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { BottomTabBar } from "@/components/feature/widget/BottomTabBar";
import { MOCK_DIGEST } from "@/lib/mock";
import styles from "./page.module.css";

export default function DigestPage() {
  const digest = MOCK_DIGEST;

  const header = (
    <div className={styles.header}>
      <div className={styles.weekLabel}>{digest.weekLabel}</div>
      <div className={styles.title}>{digest.roomLabel}</div>
    </div>
  );

  return (
    <MobileScreen header={header} footer={<BottomTabBar active="digest" showDigest />}>
      <div className={styles.body}>
        <section className={styles.personCard}>
          <div className={styles.personBar}>
            <Trophy size={14} aria-hidden />
            이번 주의 인물
          </div>
          <div className={styles.personBody}>
            <Avatar name={digest.personOfWeek.name} size="lg" />
            <div>
              <div className={styles.personName}>{digest.personOfWeek.name}</div>
              <div className={styles.personNote}>{digest.personOfWeek.note}</div>
            </div>
          </div>
        </section>

        <section className={styles.scoopCard}>
          <div className={styles.cardLabel} data-tone="accent">
            <Newspaper size={14} aria-hidden />
            이번 주의 특종
          </div>
          <div className={styles.scoopHeadline}>{digest.scoopOfWeek.headline}</div>
          <div className={styles.scoopMeta}>{digest.scoopOfWeek.meta}</div>
        </section>

        <section className={styles.reporterCard}>
          <Avatar name={digest.reporterOfWeek.name} size="lg" emphasized />
          <div>
            <div className={styles.cardLabel} data-tone="economy">
              <PenLine size={13} aria-hidden />
              이번 주의 기자
            </div>
            <div className={styles.reporterName}>
              {digest.reporterOfWeek.name}{" "}
              <span className={styles.reporterNote}>· {digest.reporterOfWeek.note}</span>
            </div>
          </div>
        </section>

        <p className={styles.caption}>매주 일요일 저녁, 알림으로 찾아와요</p>
      </div>
    </MobileScreen>
  );
}
