"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { TextField } from "@/components/common/shared/ui/TextField";
import { useLoginMutation } from "@/hooks/features/query/mutations/useLoginMutation";
import { useSignupMutation } from "@/hooks/features/query/mutations/useSignupMutation";
import { normalizeApiError } from "@/lib/api/errors";
import styles from "./AuthScreen.module.css";

type Mode = "login" | "signup";

/**
 * 로그인/회원가입 화면. 미인증 상태에서 SessionProvider 게이트가 렌더한다.
 *
 * 성공 시 데이터 계층이 tokenStore에 토큰을 저장하고, 그 변경을 구독하는 세션 게이트가
 * 자동으로 앱 화면으로 전환하므로 여기서 별도 네비게이션은 하지 않는다.
 */
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const loginMutation = useLoginMutation();
  const signupMutation = useSignupMutation();
  const active = mode === "login" ? loginMutation : signupMutation;

  const isSignup = mode === "signup";
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!isSignup || displayName.trim().length > 0) &&
    !active.isPending;

  const toggleMode = () => {
    loginMutation.reset();
    signupMutation.reset();
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (isSignup) {
      signupMutation.mutate({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
    } else {
      loginMutation.mutate({ email: email.trim(), password });
    }
  };

  const errorMessage = active.isError
    ? deriveErrorMessage(mode, active.error)
    : null;

  return (
    <MobileScreen>
      <form className={styles.form} onSubmit={submit} noValidate>
        <header className={styles.header}>
          <h1 className={styles.title}>이거 진짜에요?</h1>
          <p className={styles.subtitle}>
            {isSignup
              ? "새 계정을 만들어 방에 참여하세요"
              : "로그인하고 우리 방 뉴스를 확인하세요"}
          </p>
        </header>

        <div className={styles.fields}>
          {isSignup && (
            <TextField
              label="이름"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              placeholder="예) 김건규"
            />
          )}
          <TextField
            label="이메일"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
          />
          <TextField
            label="비밀번호"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="••••••••"
          />
        </div>

        {errorMessage && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className={styles.submit}
          disabled={!canSubmit}
        >
          {submitLabel(mode, active.isPending)}
        </Button>

        <button type="button" className={styles.toggle} onClick={toggleMode}>
          {isSignup
            ? "이미 계정이 있으신가요? 로그인"
            : "계정이 없으신가요? 회원가입"}
        </button>
      </form>
    </MobileScreen>
  );
}

function submitLabel(mode: Mode, pending: boolean): string {
  if (mode === "login") return pending ? "로그인 중…" : "로그인";
  return pending ? "가입 중…" : "가입하기";
}

function deriveErrorMessage(mode: Mode, error: unknown): string {
  const apiError = normalizeApiError(error);

  if (apiError.code === "network_error") {
    return "네트워크 오류가 발생했어요. 연결을 확인해 주세요.";
  }
  if (mode === "login" && apiError.status === 401) {
    return "이메일 또는 비밀번호가 올바르지 않습니다";
  }
  if (mode === "signup" && apiError.status === 409) {
    return "이미 가입된 이메일입니다";
  }
  if (apiError.code === "validation_failed") {
    return "입력한 정보를 다시 확인해 주세요.";
  }
  return mode === "login"
    ? "로그인하지 못했어요. 잠시 후 다시 시도해 주세요."
    : "가입하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
