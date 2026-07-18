"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { TextField } from "@/components/common/shared/ui/TextField";
import { useUpdateProfileMutation } from "@/hooks/features/query/mutations/useUpdateProfileMutation";
import styles from "./OnboardingForm.module.css";

/** 서버가 이름을 못 받았을 때 넣는 기본 표시 이름 — 프리필에서 비운다. */
const PLACEHOLDER_NAME = "이름 없음";

/**
 * 온보딩(기본 정보 입력) 화면. 소셜 로그인은 네이티브가 하고, 신규 사용자의 이름 입력은
 * 웹이 담당한다. 세션 게이트가 `me.onboarded === false` 일 때 렌더한다.
 *
 * 이름 저장(PATCH /me)에 성공하면 서버가 onboarded 를 true 로 바꾸고, me 캐시가 갱신되어
 * 게이트가 앱으로 전환한다.
 */
export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [displayName, setDisplayName] = useState(
    defaultName === PLACEHOLDER_NAME ? "" : defaultName,
  );
  const mutation = useUpdateProfileMutation();
  const canSubmit = displayName.trim().length > 0 && !mutation.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({ displayName: displayName.trim() });
  };

  return (
    <MobileScreen>
      <form className={styles.form} onSubmit={submit} noValidate>
        <header className={styles.header}>
          <h1 className={styles.title}>반가워요!</h1>
          <p className={styles.subtitle}>기사에 쓸 이름을 알려주세요</p>
        </header>

        <TextField
          label="이름"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          placeholder="예) 김건규"
        />

        {mutation.isError && (
          <p className={styles.error} role="alert">
            저장하지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className={styles.submit}
          disabled={!canSubmit}
        >
          {mutation.isPending ? "저장 중…" : "시작하기"}
        </Button>
      </form>
    </MobileScreen>
  );
}
