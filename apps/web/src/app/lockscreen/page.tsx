"use client";

import {
  BatteryFull,
  Camera,
  Flame,
  Flashlight,
  Lock,
  Signal,
  Wifi,
} from "lucide-react";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { MOCK_LOCKSCREEN } from "@/lib/mock";
import styles from "./page.module.css";

export default function LockScreenPage() {
  const lock = MOCK_LOCKSCREEN;

  return (
    <MobileScreen tone="dark">
      <div className={styles.screen}>
        <div className={styles.statusBar}>
          <span className={styles.statusTime}>{lock.timeLabel}</span>
          <span className={styles.statusIcons}>
            <Signal size={16} aria-hidden />
            <Wifi size={16} aria-hidden />
            <BatteryFull size={24} aria-hidden />
          </span>
        </div>

        <div className={styles.clock}>
          <div className={styles.date}>
            <Lock size={13} aria-hidden />
            {lock.dateLabel}
          </div>
          <div className={styles.time}>{lock.timeLabel}</div>
        </div>

        <div className={styles.notifications}>
          {lock.notifications.map((note, index) => (
            <div key={index} className={styles.note}>
              <div className={styles.noteHead}>
                <span className={styles.appIcon}>
                  <Flame size={12} aria-hidden />
                </span>
                <span className={styles.appName}>이거 진짜에요?</span>
                <span className={styles.noteTime}>{note.timeAgo}</span>
              </div>
              <div className={styles.noteHeadline}>{note.headline}</div>
              <div className={styles.noteMeta}>{note.meta}</div>
            </div>
          ))}
        </div>

        <p className={styles.caption}>
          알림은 하루 1~2건만 · 반응 많은 기사 우선
        </p>

        <div className={styles.controls}>
          <span className={styles.controlButton}>
            <Flashlight size={19} aria-hidden />
          </span>
          <span className={styles.homeBar} />
          <span className={styles.controlButton}>
            <Camera size={19} aria-hidden />
          </span>
        </div>
      </div>
    </MobileScreen>
  );
}
