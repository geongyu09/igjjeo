"use client";

import { LockOpen } from "lucide-react";
import { useState } from "react";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { BottomTabBar } from "@/components/feature/widget/BottomTabBar";
import { SubscriptionRow } from "@/components/feature/widget/SubscriptionRow";
import { useStackBack } from "@/hooks/common/useStackBack";
import { INITIAL_SUBSCRIPTIONS } from "@/lib/mock";
import type { OutletKey } from "@/lib/publishers";
import styles from "./page.module.css";

const ORDER: OutletKey[] = ["shock", "emotion", "daily", "economy", "science"];

export default function SubscriptionsPage() {
  const back = useStackBack();
  const [subs, setSubs] = useState<Record<OutletKey, boolean>>(INITIAL_SUBSCRIPTIONS);

  const toggle = (outlet: OutletKey, next: boolean) =>
    setSubs((prev) => ({ ...prev, [outlet]: next }));

  return (
    <MobileScreen
      header={<ScreenHeader title="언론사 구독" onBack={back} />}
      footer={<BottomTabBar active="profile" />}
    >
      <div className={styles.body}>
        <p className={styles.intro}>구독한 언론사 기사가 피드 위쪽에 더 자주 떠요.</p>
        <div className={styles.list}>
          {ORDER.map((outlet) => (
            <SubscriptionRow
              key={outlet}
              outlet={outlet}
              subscribed={subs[outlet]}
              onChange={(next) => toggle(outlet, next)}
            />
          ))}
        </div>
        <div className={styles.notice}>
          <LockOpen size={16} aria-hidden className={styles.noticeIcon} />
          <div>
            구독 목록은 프로필에 공개돼요. <b>&ldquo;너 아직도 데일리쇼크 구독해?&rdquo;</b>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
}
