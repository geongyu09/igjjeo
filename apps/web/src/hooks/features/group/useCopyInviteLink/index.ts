"use client";

import { useCallback } from "react";
import { useToast } from "@/components/common/shared/ui/Toast";

/**
 * 방 초대 링크를 클립보드에 복사하고 완료 토스트를 띄운다.
 * 반환 함수는 복사할 방의 초대 코드를 받는다.
 *
 * 초대 링크 수신(자동 참여) 로직은 아직 없다 — 현재는 초대 코드 입력으로만 방에 참여한다.
 */
export function useCopyInviteLink() {
  const { showToast } = useToast();

  return useCallback(
    async (inviteCode: string) => {
      const link = `${window.location.origin}/?invite=${inviteCode}`;
      await navigator.clipboard.writeText(link);
      showToast("초대 링크를 복사했어요");
    },
    [showToast],
  );
}
