"use client";

import { LogOut, Megaphone } from "lucide-react";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { useSession } from "@/components/common/shared/SessionProvider";
import { useOpenScreen } from "@/hooks/common/useOpenScreen";
import { useLogoutMutation } from "@/hooks/features/query/mutations/useLogoutMutation";
import { useReportQuotaQuery } from "@/hooks/features/query/querys/useReportQuotaQuery";
import { useMemberProfileSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useMemberProfileSuspenseQuery";
import type { MemberProfileSummary } from "@/lib/api/types";
import { PUBLISHERS } from "@/lib/publishers";
import styles from "./page.module.css";

const EMPTY_SUMMARY: MemberProfileSummary = {
  stats: { reports: 0, reactions: 0, scoops: 0 },
  reports: [],
};

export default function ProfilePage() {
  const { me, activeGroupId } = useSession();

  return (
    <MobileScreen header={<ScreenHeader title="프로필" leading="none" />}>
      <div className={styles.body}>
        <div className={styles.identity}>
          <Avatar name={me.display_name} size="lg" emphasized />
          <div>
            <div className={styles.name}>{me.display_name}</div>
          </div>
        </div>

        {activeGroupId ? (
          <QueryBoundary>
            <ProfileActivity groupId={activeGroupId} />
          </QueryBoundary>
        ) : (
          <ProfileBody summary={EMPTY_SUMMARY} />
        )}

        <ReportQuotaSection />
        <SettingsSection />
      </div>
    </MobileScreen>
  );
}

/**
 * 제보 한도 — 남은 횟수와 충전 버튼. 충전 버튼은 충전 방법을 고르는 충전 화면(/recharge)을 연다.
 * 한도가 남아 있으면 충전할 이유가 없어 비활성.
 * 한도 조회는 suspense가 아니라서(useReportQuotaQuery), 아직 못 불러왔으면 섹션을 숨긴다.
 */
function ReportQuotaSection() {
  const { data: quota } = useReportQuotaQuery();
  const openScreen = useOpenScreen();

  if (!quota) {
    return null;
  }

  const isExhausted = quota.remaining === 0;

  return (
    <>
      <div className={styles.sectionLabel}>제보 한도</div>
      <div className={styles.quota}>
        <Megaphone size={16} className={styles.quotaIcon} aria-hidden />
        <span className={styles.quotaText} data-empty={isExhausted}>
          {isExhausted
            ? `오늘 제보 한도 ${quota.limit}회를 모두 사용했어요`
            : `오늘 제보 한도 ${quota.limit}회 중 ${quota.remaining}회 남음`}
        </span>
        <Button
          size="sm"
          variant="accent"
          disabled={!isExhausted}
          onClick={() => openScreen("/recharge")}
        >
          충전하기
        </Button>
      </div>
    </>
  );
}

/**
 * 설정 — 지금은 로그아웃 하나뿐이다. 로그아웃은 서버 세션 종료와 함께 로컬 토큰·활성 방·
 * 서버 상태 캐시를 비우고(useLogoutMutation), 네이티브 셸이면 브리지로 네이티브 세션까지
 * 지워 로그인 스크린으로 되돌린다.
 */
function SettingsSection() {
  const { mutate: logout, isPending } = useLogoutMutation();

  return (
    <>
      <div className={styles.sectionLabel}>설정</div>
      <div className={styles.settings}>
        <button
          type="button"
          className={styles.settingsRow}
          data-danger=""
          disabled={isPending}
          onClick={() => logout()}
        >
          <LogOut size={16} aria-hidden />
          <span>{isPending ? "로그아웃 중…" : "로그아웃"}</span>
        </button>
      </div>
    </>
  );
}

function ProfileActivity({ groupId }: { groupId: string }) {
  const { data } = useMemberProfileSuspenseQuery({ groupId });
  return <ProfileBody summary={data} />;
}

function ProfileBody({ summary }: { summary: MemberProfileSummary }) {
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
