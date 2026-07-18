"use client";

import { Settings } from "lucide-react";
import { useStackLinkRouter } from "stack-link";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { useSession } from "@/components/common/shared/SessionProvider";
import { useMemberProfileSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useMemberProfileSuspenseQuery";
import type { MemberProfileSummary, Profile } from "@/lib/api/types";
import { PUBLISHERS } from "@/lib/publishers";
import styles from "./page.module.css";

const EMPTY_SUMMARY: MemberProfileSummary = {
  stats: { reports: 0, reactions: 0, scoops: 0 },
  reports: [],
};

export default function ProfilePage() {
  const { navigate } = useStackLinkRouter({});
  const { me, activeGroupId } = useSession();

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
          <Avatar name={me.display_name} size="lg" emphasized />
          <div>
            <div className={styles.name}>{me.display_name}</div>
          </div>
        </div>

        {activeGroupId ? (
          <QueryBoundary>
            <ProfileActivity me={me} groupId={activeGroupId} />
          </QueryBoundary>
        ) : (
          <ProfileBody me={me} summary={EMPTY_SUMMARY} />
        )}
      </div>
    </MobileScreen>
  );
}

function ProfileActivity({ me, groupId }: { me: Profile; groupId: string }) {
  const { data } = useMemberProfileSuspenseQuery({ groupId });
  return <ProfileBody me={me} summary={data} />;
}

function ProfileBody({
  me,
  summary,
}: {
  me: Profile;
  summary: MemberProfileSummary;
}) {
  const stats: { value: number; label: string }[] = [
    { value: summary.stats.reports, label: "제보" },
    { value: summary.stats.reactions, label: "받은 반응" },
    { value: summary.stats.scoops, label: "특종" },
  ];

  return (
    <>
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
        {me.subscribed_outlets.map((outlet) => (
          <PublisherBadge key={outlet} outlet={outlet} />
        ))}
      </div>

      <div className={styles.sectionLabel}>내가 낸 제보</div>
      <ul className={styles.reports}>
        {summary.reports.map((report) => (
          <li
            key={report.id}
            className={styles.reportRow}
            data-outlet={report.outlet_key}
          >
            <div className={styles.reportInfo}>
              <span className={styles.reportOutlet}>
                {PUBLISHERS[report.outlet_key].name}
              </span>
              <div className={styles.reportHeadline}>{report.headline}</div>
            </div>
            <span className={styles.reportViews}>
              반응 {report.reaction_count}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
