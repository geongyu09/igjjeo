"use client";

import { Users } from "lucide-react";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { useGroupMembersSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useGroupMembersSuspenseQuery";
import { useGroupSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useGroupSuspenseQuery";
import { ContextEditor } from "./components/ContextEditor";
import styles from "./RoomSettingsSection.module.css";

/**
 * 뉴스룸 탭 본문 — 활성 방의 이름·컨텍스트(각색 키워드)·멤버를 보여주고,
 * 방장(role=owner)에게만 컨텍스트 수정을 연다. 멤버 관리는 이 화면의 범위가 아니다(조회만).
 *
 * 방 상세·멤버 목록을 suspense 쿼리로 읽으므로, 상위(page)에서 QueryBoundary 로 감싼다.
 */
export function RoomSettingsSection({ groupId }: { groupId: string }) {
  const { data: group } = useGroupSuspenseQuery({ groupId });
  const { data: members } = useGroupMembersSuspenseQuery({ groupId });
  const isOwner = group.role === "owner";

  return (
    <div className={styles.section}>
      <div className={styles.hero}>
        <span className={styles.roomIcon} aria-hidden>
          <Users size={20} />
        </span>
        <div className={styles.roomInfo}>
          <div className={styles.roomName}>{group.name}</div>
          <div className={styles.roomMeta}>멤버 {group.member_count}명</div>
        </div>
      </div>

      <div className={styles.sectionLabel}>방 컨텍스트</div>
      <ContextEditor
        groupId={groupId}
        keyword={group.keyword ?? null}
        canEdit={isOwner}
      />

      <div className={styles.sectionLabel}>멤버 {members.items.length}</div>
      <ul className={styles.members}>
        {members.items.map((member) => (
          <li key={member.user_id} className={styles.member}>
            <Avatar name={member.display_name} />
            <span className={styles.memberInfo}>
              <span className={styles.memberName}>
                {member.display_name}
                {member.role === "owner" && (
                  <span className={styles.roleBadge}>방장</span>
                )}
              </span>
              <span className={styles.memberMasked}>{member.masked_name}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
