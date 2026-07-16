"use client";

import { Link2, Share2 } from "lucide-react";
import { useStackLinkRouter } from "stack-link";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { TextField } from "@/components/common/shared/ui/TextField";
import { useStackBack } from "@/hooks/common/useStackBack";
import { MOCK_GROUP } from "@/lib/mock";
import styles from "./page.module.css";

export default function CreateGroupPage() {
  const back = useStackBack();
  const { navigate } = useStackLinkRouter({});
  const group = MOCK_GROUP;

  const footer = (
    <div className={styles.ctaBar}>
      <Button size="lg" className={styles.cta} onClick={() => navigate({ href: "/", animation: "none" })}>
        뉴스룸 시작하기
      </Button>
    </div>
  );

  return (
    <MobileScreen header={<ScreenHeader title="새 뉴스룸" onBack={back} />} footer={footer}>
      <div className={styles.body}>
        <TextField label="방 이름" defaultValue={group.name} />

        <div className={styles.codeBox}>
          <div className={styles.codeLabel}>초대 코드</div>
          <div className={styles.code}>{group.inviteCode}</div>
          <div className={styles.codeHint}>코드를 아는 사람만 들어올 수 있어요</div>
        </div>

        <div className={styles.shareRow}>
          <Button variant="secondary" size="lg" className={styles.shareButton}>
            <Link2 size={15} aria-hidden />
            링크 복사
          </Button>
          <Button variant="secondary" size="lg" className={styles.shareButton}>
            <Share2 size={15} aria-hidden />
            공유하기
          </Button>
        </div>

        <div className={styles.sectionLabel}>멤버 · {group.members.length}</div>
        <ul className={styles.members}>
          {group.members.map((member) =>
            member.pending ? (
              <li key={member.label} className={styles.memberPending}>
                <span className={styles.pendingAvatar} aria-hidden />
                <span className={styles.pendingLabel}>{member.label}</span>
              </li>
            ) : (
              <li key={member.label} className={styles.member}>
                <Avatar name={member.label} emphasized />
                <span className={styles.memberName}>
                  {member.label}
                  {member.role && <span className={styles.roleBadge}>{member.role}</span>}
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    </MobileScreen>
  );
}
