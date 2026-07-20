"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/common/shared/ui/Button";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { getApiBaseUrl } from "@/lib/api/client";
import { isApiError, isConnectionError } from "@/lib/api/errors";
import styles from "./ErrorScreen.module.css";

export interface ErrorScreenProps {
  error: unknown;
  /** 재시도 핸들러 (ErrorBoundary의 reset 등) */
  onRetry?: () => void;
  /** 연결 실패 시 개발자용 진단(요청 대상 주소) 노출 여부. 기본값은 개발 빌드에서만 true. */
  diagnostics?: boolean;
  className?: string;
}

/** ApiError code를 사용자 친화 문구로. 서버가 새 code를 보내도 기본 문구로 안전하게 처리. */
function messageForError(error: unknown): {
  title: string;
  description: string;
} {
  if (isApiError(error)) {
    switch (error.code) {
      case "unauthorized":
      case "token_expired":
        return {
          title: "로그인이 필요해요",
          description: "세션이 만료되었어요. 다시 시도해 주세요.",
        };
      case "forbidden":
        return {
          title: "접근할 수 없어요",
          description: "이 방의 내용을 볼 권한이 없어요.",
        };
      case "not_found":
        return {
          title: "찾을 수 없어요",
          description: "요청한 내용이 사라졌거나 이동했어요.",
        };
      case "network_error":
        return {
          title: "연결이 불안정해요",
          description: "네트워크 상태를 확인하고 다시 시도해 주세요.",
        };
      case "timeout":
        return {
          title: "서버가 응답하지 않아요",
          description: "잠시 후 다시 시도해 주세요.",
        };
      case "rate_limited":
        return {
          title: "잠시 후 다시 시도해 주세요",
          description: "요청이 너무 많아요.",
        };
    }
  }
  return {
    title: "문제가 생겼어요",
    description: "내용을 불러오지 못했어요. 다시 시도해 주세요.",
  };
}

/** ErrorBoundary fallback — 오류 안내 + 재시도 버튼. */
export function ErrorScreen({
  error,
  onRetry,
  diagnostics = process.env.NODE_ENV !== "production",
  className,
}: ErrorScreenProps) {
  const { title, description } = messageForError(error);
  // 서버에 닿지 못했을 때만 노출한다. 원인이 대개 API 주소 설정(개발 머신 LAN IP 변경 등)이라
  // 어디로 붙으려다 실패했는지 보여주면 개발자가 바로 판단할 수 있다.
  const showDiagnostics = diagnostics && isConnectionError(error);

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <EmptyState
        icon={<CloudOff size={22} aria-hidden />}
        title={title}
        description={description}
        action={
          onRetry && (
            <Button variant="secondary" size="md" onClick={onRetry}>
              <RotateCw size={16} aria-hidden />
              다시 시도
            </Button>
          )
        }
      />
      {showDiagnostics && (
        <p
          className={`t-mono ${styles.diagnostics}`}
          data-testid="error-diagnostics"
        >
          API {getApiBaseUrl()} 에 연결하지 못했습니다.
          <br />
          서버 기동 여부와 API 주소(NEXT_PUBLIC_API_BASE_URL)를 확인하세요.
        </p>
      )}
    </div>
  );
}
