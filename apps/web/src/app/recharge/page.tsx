"use client";

import {
  CreditCard,
  FlaskConical,
  type LucideIcon,
  Megaphone,
} from "lucide-react";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { useStackBack } from "@/hooks/common/useStackBack";
import { useRefillReportQuotaMutation } from "@/hooks/features/query/mutations/useRefillReportQuotaMutation";
import styles from "./page.module.css";

/** 아직 구현되지 않은(준비 중) 충전 방법 목록. 프로토타입 테스트용 충전만 실제로 동작한다. */
const COMING_SOON: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Megaphone,
    title: "광고 보고 충전",
    desc: "짧은 광고를 보고 제보 한도를 채워요",
  },
  {
    icon: CreditCard,
    title: "인앱결제",
    desc: "결제하고 제보 한도를 채워요",
  },
];

/**
 * 충전 화면 — 제보 한도를 채울 방법을 고른다. 지금은 최상단 "프로토타입 테스트용 충전"만
 * 동작하며, 누르면 프로필의 충전 버튼과 동일하게 한도를 즉시 가득 채우고 화면을 닫는다.
 * 광고·인앱결제 등 이후 방법은 목록에만 노출하고 준비 중으로 비활성 처리한다.
 */
export default function RechargePage() {
  const back = useStackBack();
  const { mutate: refill, isPending } = useRefillReportQuotaMutation();

  const chargeTest = () => {
    if (isPending) return;
    refill(undefined, { onSuccess: () => back() });
  };

  return (
    <MobileScreen header={<ScreenHeader title="충전하기" onBack={back} />}>
      <div className={styles.body}>
        <p className={styles.intro}>제보 한도를 채울 방법을 골라 주세요.</p>
        <ul className={styles.methods}>
          <li>
            <button
              type="button"
              className={styles.method}
              onClick={chargeTest}
              disabled={isPending}
            >
              <FlaskConical
                size={20}
                className={styles.methodIcon}
                aria-hidden
              />
              <span className={styles.methodInfo}>
                <span className={styles.methodTitle}>
                  프로토타입 테스트용 충전
                </span>
                <span className={styles.methodDesc}>
                  {isPending ? "충전 중…" : "제보 한도를 즉시 가득 채워요"}
                </span>
              </span>
            </button>
          </li>
          {COMING_SOON.map(({ icon: Icon, title, desc }) => (
            <li key={title}>
              <div className={styles.method} data-disabled="">
                <Icon size={20} className={styles.methodIcon} aria-hidden />
                <span className={styles.methodInfo}>
                  <span className={styles.methodTitle}>{title}</span>
                  <span className={styles.methodDesc}>{desc}</span>
                </span>
                <span className={styles.badge}>준비 중</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MobileScreen>
  );
}
