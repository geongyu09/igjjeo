"use client";

import { Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { useStackLinkRouter } from "stack-link";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { TextField } from "@/components/common/shared/ui/TextField";
import { useSession } from "@/components/common/shared/SessionProvider";
import { useStackBack } from "@/hooks/common/useStackBack";
import { useCreateGroupMutation } from "@/hooks/features/query/mutations/useCreateGroupMutation";
import type { Group } from "@/lib/api/types";
import styles from "./page.module.css";

export default function CreateGroupPage() {
  const back = useStackBack();
  const { navigate } = useStackLinkRouter({});
  const { me } = useSession();
  const createGroup = useCreateGroupMutation();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<Group | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || createGroup.isPending) return;
    createGroup.mutate({ name: trimmed }, { onSuccess: setCreated });
  };

  const footer = created ? (
    <div className={styles.ctaBar}>
      <Button
        size="lg"
        className={styles.cta}
        onClick={() => navigate({ href: "/", animation: "none" })}
      >
        뉴스룸 시작하기
      </Button>
    </div>
  ) : (
    <div className={styles.ctaBar}>
      <Button
        size="lg"
        className={styles.cta}
        disabled={name.trim().length === 0 || createGroup.isPending}
        onClick={submit}
      >
        {createGroup.isPending ? "만드는 중…" : "뉴스룸 만들기"}
      </Button>
    </div>
  );

  return (
    <MobileScreen
      header={<ScreenHeader title="새 뉴스룸" onBack={back} />}
      footer={footer}
    >
      <div className={styles.body}>
        <TextField
          label="방 이름"
          value={created ? created.name : name}
          onChange={(event) => setName(event.target.value)}
          readOnly={!!created}
          placeholder="예) 3조 뉴스룸"
        />

        {createGroup.isError && !created && (
          <div className={styles.codeHint} role="alert">
            방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        {created && (
          <>
            <div className={styles.codeBox}>
              <div className={styles.codeLabel}>초대 코드</div>
              <div className={styles.code}>{created.invite_code}</div>
              <div className={styles.codeHint}>
                코드를 아는 사람만 들어올 수 있어요
              </div>
            </div>

            <div className={styles.shareRow}>
              <Button
                variant="secondary"
                size="lg"
                className={styles.shareButton}
              >
                <Link2 size={15} aria-hidden />
                링크 복사
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className={styles.shareButton}
              >
                <Share2 size={15} aria-hidden />
                공유하기
              </Button>
            </div>

            <div className={styles.sectionLabel}>
              멤버 · {created.member_count}
            </div>
            <ul className={styles.members}>
              <li className={styles.member}>
                <Avatar name={me.display_name} emphasized />
                <span className={styles.memberName}>
                  {me.display_name}
                  <span className={styles.roleBadge}>방장</span>
                </span>
              </li>
            </ul>
          </>
        )}
      </div>
    </MobileScreen>
  );
}
