"use client";

import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/common/shared/ui/Button";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { useSessionExpiredRecovery } from "@/hooks/common/useSessionExpiredRecovery";
import styles from "./SessionExpiredScreen.module.css";

/**
 * 세션 만료·무효(401)로 "로그인이 필요"한 상태에 도달했을 때 표시하는 화면.
 * 재시도로는 풀리지 않으므로 "다시 시도" 대신 "로그인 하러 가기" 버튼을 준다.
 * 버튼을 누르면 로그아웃 후 로그인 화면으로 되돌린다(useSessionExpiredRecovery).
 */
export function SessionExpiredScreen() {
  const goToLogin = useSessionExpiredRecovery();
  return (
    <div className={styles.wrap}>
      <EmptyState
        icon={<Lock size={22} aria-hidden />}
        title="로그인이 필요해요"
        description="세션이 만료되었어요. 다시 로그인해 주세요."
        action={
          <Button variant="primary" size="md" onClick={goToLogin}>
            <LogIn size={16} aria-hidden />
            로그인 하러 가기
          </Button>
        }
      />
    </div>
  );
}
