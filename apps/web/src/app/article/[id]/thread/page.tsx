"use client";

import { Flag, MoreHorizontal } from "lucide-react";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { CorrectionThread } from "@/components/feature/widget/CorrectionThread";
import { useStackBack } from "@/hooks/common/useStackBack";
import { CORRECTION_THREAD } from "@/lib/mock";
import styles from "./page.module.css";

export default function CorrectionThreadPage() {
  const back = useStackBack();

  const header = (
    <ScreenHeader
      title="지각 사건 · 3보"
      onBack={back}
      trailing={
        <button type="button" className={styles.moreButton} aria-label="더보기">
          <MoreHorizontal size={22} aria-hidden />
        </button>
      }
    />
  );

  const footer = (
    <div className={styles.ctaBar}>
      <button type="button" className={styles.requestButton}>
        <Flag size={16} aria-hidden />
        나도 정정 요청
      </button>
    </div>
  );

  return (
    <MobileScreen header={header} footer={footer}>
      <div className={styles.body}>
        <CorrectionThread items={CORRECTION_THREAD} />
        <p className={styles.tail}>…이 사건, 아직 안 끝났습니다</p>
      </div>
    </MobileScreen>
  );
}
