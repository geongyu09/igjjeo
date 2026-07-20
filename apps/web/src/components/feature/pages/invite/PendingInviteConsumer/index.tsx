"use client";

import { useEffect, useRef } from "react";
import { LoadingScreen } from "@/components/common/shared/ui/LoadingScreen";
import { useToast } from "@/components/common/shared/ui/Toast";
import { useEnterRoom } from "@/hooks/common/useEnterRoom";
import { usePendingInvite } from "@/hooks/features/group/usePendingInvite";
import { useJoinGroupMutation } from "@/hooks/features/query/mutations/useJoinGroupMutation";
import { pendingInviteStore } from "@/lib/session/pendingInviteStore";
import styles from "./PendingInviteConsumer.module.css";

/**
 * 대기 중인 초대 코드가 있으면 방에 자동 참여시킨다.
 *
 * 세션이 준비된 뒤(SessionProvider 내부)에만 마운트된다 — 초대 딥링크로 앱에 들어와 로그인·
 * 온보딩을 마친 사용자를 그 방으로 데려간다. 참여(멱등)에 성공하면 활성 방으로 진입시키고
 * (useEnterRoom → 앱은 하단 탭으로 전환) 코드를 비운다. 실패하면 안내 토스트를 띄우고 코드를
 * 비워 재시도 루프를 막는다(만료·오타 코드가 실행마다 반복되지 않게).
 *
 * 참여가 진행되는 동안에는 전체 화면 로딩으로 뒤 화면 조작을 막는다.
 */
export function PendingInviteConsumer() {
  const pending = usePendingInvite();
  const joinGroup = useJoinGroupMutation();
  const enterRoom = useEnterRoom();
  const { showToast } = useToast();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!pending || startedRef.current) return;
    startedRef.current = true;
    joinGroup.mutate(
      { inviteCode: pending },
      {
        onSuccess: (group) => {
          pendingInviteStore.clear();
          enterRoom(group.id);
        },
        onError: () => {
          pendingInviteStore.clear();
          showToast("초대에 참여하지 못했어요. 코드를 확인해 주세요.");
        },
      },
    );
  }, [pending, joinGroup, enterRoom, showToast]);

  if (pending && joinGroup.isPending) {
    return (
      <div className={styles.overlay}>
        <LoadingScreen label="초대 확인 중" />
      </div>
    );
  }
  return null;
}
