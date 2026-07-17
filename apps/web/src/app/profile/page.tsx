"use client";

import { PenLine, Settings } from "lucide-react";
import { useStackLinkRouter } from "stack-link";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { useSession } from "@/components/common/shared/SessionProvider";
import { MOCK_PROFILE } from "@/lib/mock";
import { PUBLISHERS } from "@/lib/publishers";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { navigate } = useStackLinkRouter({});
  const { me } = useSession();
  // 이름·아바타는 실제 세션(me)에서. 통계·구독·제보 목록은 아직 전용 엔드포인트가 없어 mock 유지.
  const profile = MOCK_PROFILE;
  const displayName = me.display_name;
  const stats: { value: number; label: string }[] = [
    { value: profile.stats.reports, label: "제보" },
    { value: profile.stats.reactions, label: "받은 반응" },
    { value: profile.stats.scoops, label: "특종" },
  ];

  const header = (
    <ScreenHeader
      title="프로필"
      leading="none"
      trailing={
        <button
          type="button"
          className={styles.settingsButton}
          aria-label="구독 설정"
          onClick={() =>
            navigate({ href: "/subscriptions", animation: "slide" })
          }
        >
          <Settings size={20} aria-hidden />
        </button>
      }
    />
  );

  return (
    <MobileScreen header={header}>
      <div className={styles.body}>
        <div className={styles.identity}>
          <Avatar name={displayName} size="lg" emphasized />
          <div>
            <div className={styles.name}>{displayName}</div>
            {profile.badge && (
              <span className={styles.badge}>
                <PenLine size={12} aria-hidden />
                {profile.badge}
              </span>
            )}
          </div>
        </div>

        <div className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.sectionLabel}>구독 중 · 공개</div>
        <div className={styles.chips}>
          {profile.subscribed.map((outlet) => (
            <PublisherBadge key={outlet} outlet={outlet} />
          ))}
        </div>

        <div className={styles.sectionLabel}>내가 낸 제보</div>
        <ul className={styles.reports}>
          {profile.myReports.map((report) => (
            <li
              key={report.headline}
              className={styles.reportRow}
              data-outlet={report.outlet}
            >
              <div className={styles.reportInfo}>
                <span className={styles.reportOutlet}>
                  {PUBLISHERS[report.outlet].name}
                </span>
                <div className={styles.reportHeadline}>{report.headline}</div>
              </div>
              <span className={styles.reportViews}>👀 {report.viewCount}</span>
            </li>
          ))}
        </ul>
      </div>
    </MobileScreen>
  );
}
