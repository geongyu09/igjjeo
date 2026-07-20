"use client";

import { Users } from "lucide-react";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { useSession } from "@/components/common/shared/SessionProvider";
import { Button } from "@/components/common/shared/ui/Button";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { RoomSettingsSection } from "@/components/feature/pages/room/RoomSettingsSection";
import { useReplaceScreen } from "@/hooks/common/useReplaceScreen";
import styles from "./page.module.css";

/** 뉴스룸 탭 — 활성 방의 이름·컨텍스트·멤버를 보여주는 탭 루트. */
export default function RoomPage() {
  const { activeGroupId } = useSession();
  const replaceScreen = useReplaceScreen();

  return (
    <MobileScreen header={<ScreenHeader title="뉴스룸" leading="none" />}>
      <div className={styles.body}>
        {activeGroupId ? (
          <QueryBoundary>
            <RoomSettingsSection groupId={activeGroupId} />
          </QueryBoundary>
        ) : (
          <EmptyState
            className={styles.empty}
            icon={<Users size={22} aria-hidden />}
            title="아직 참여한 방이 없어요"
            description="방을 만들거나 초대 코드로 참여하면 이곳에서 방 정보를 볼 수 있어요."
            action={
              <Button onClick={() => replaceScreen("/group")}>방 고르기</Button>
            }
          />
        )}
      </div>
    </MobileScreen>
  );
}
