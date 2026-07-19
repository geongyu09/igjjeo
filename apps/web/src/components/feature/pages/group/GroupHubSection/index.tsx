"use client";

import { ChevronRight, LogOut, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useStackLinkRouter } from "stack-link";
import { useSession } from "@/components/common/shared/SessionProvider";
import { Button } from "@/components/common/shared/ui/Button";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { TextField } from "@/components/common/shared/ui/TextField";
import { useEnterRoom } from "@/hooks/common/useEnterRoom";
import { useJoinGroupMutation } from "@/hooks/features/query/mutations/useJoinGroupMutation";
import { useLogoutMutation } from "@/hooks/features/query/mutations/useLogoutMutation";
import styles from "./GroupHubSection.module.css";

/**
 * 방 허브 — 로그인 후 처음 만나는 화면. 내가 속한 방을 골라 들어가거나(방 진입), 초대 코드로
 * 새 방에 참여하거나, 새 뉴스룸을 만든다. 방을 고르면 useEnterRoom으로 활성 방을 정하고
 * 방 안(하단 탭 화면)으로 들어간다. 참여 성공 시에도 그 방으로 바로 진입한다.
 */
export function GroupHubSection() {
  const { groups } = useSession();
  const enterRoom = useEnterRoom();
  const joinGroup = useJoinGroupMutation();
  const logout = useLogoutMutation();
  const { navigate } = useStackLinkRouter({});
  const [inviteCode, setInviteCode] = useState("");

  const submitJoin = () => {
    const code = inviteCode.trim();
    if (!code || joinGroup.isPending) return;
    joinGroup.mutate(
      { inviteCode: code },
      { onSuccess: (group) => enterRoom(group.id) },
    );
  };

  return (
    <MobileScreen header={<ScreenHeader title="내 뉴스룸" leading="none" />}>
      <div className={styles.body}>
        {groups.length > 0 ? (
          <ul className={styles.rooms}>
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  className={styles.roomRow}
                  onClick={() => enterRoom(group.id)}
                >
                  <span className={styles.roomIcon} aria-hidden>
                    <Users size={18} />
                  </span>
                  <span className={styles.roomInfo}>
                    <span className={styles.roomName}>{group.name}</span>
                    <span className={styles.roomMeta}>
                      멤버 {group.member_count}
                      {group.role === "owner" && (
                        <span className={styles.roleBadge}>방장</span>
                      )}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden
                    className={styles.chevron}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className={styles.empty}
            icon={<Users size={22} aria-hidden />}
            title="아직 참여한 방이 없어요"
            description="초대 코드로 참여하거나 새 뉴스룸을 만들어 보세요."
          />
        )}

        <div className={styles.joinBox}>
          <div className={styles.sectionLabel}>초대 코드로 참여</div>
          <TextField
            label="초대 코드"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="예) A1B2C3"
            autoCapitalize="characters"
            autoComplete="off"
            error={
              joinGroup.isError
                ? "참여하지 못했어요. 코드를 확인해 주세요."
                : undefined
            }
          />
          <Button
            size="lg"
            className={styles.joinButton}
            disabled={inviteCode.trim().length === 0 || joinGroup.isPending}
            onClick={submitJoin}
          >
            {joinGroup.isPending ? "참여 중…" : "참여"}
          </Button>
        </div>

        <Button
          variant="secondary"
          size="lg"
          className={styles.createButton}
          onClick={() => navigate({ href: "/group/new", animation: "slide" })}
        >
          <Plus size={16} aria-hidden />새 뉴스룸 만들기
        </Button>

        <button
          type="button"
          className={styles.logoutButton}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut size={13} aria-hidden />
          {logout.isPending ? "로그아웃 중…" : "로그아웃"}
        </button>
      </div>
    </MobileScreen>
  );
}
