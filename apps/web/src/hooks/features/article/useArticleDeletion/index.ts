"use client";

import { useCallback, useRef, useState } from "react";
import { useRequestDeletionMutation } from "@/hooks/features/query/mutations/useRequestDeletionMutation";
import { isApiError } from "@/lib/api/errors";
import { randomUUID } from "@/lib/uuid";

export interface UseArticleDeletionProps {
  articleId: string;
  /** 피드 캐시 무효화용 방 id. */
  groupId?: string;
  /** 기사가 내려간 뒤 — 상세는 더 이상 열람할 수 없으므로 화면을 떠나야 한다. */
  onDeleted?: () => void;
}

function toMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "기사를 내리지 못했어요. 잠시 후 다시 시도해 주세요.";
  }
  return error.message || "기사를 내리지 못했어요.";
}

/**
 * 기사 내리기 흐름 — 확인 다이얼로그·실패 안내·멱등 키를 함께 관리한다.
 *
 * 기사는 하드 삭제되지 않고 `is_active=false`로 내려갈 뿐이며, **올린 사람만** 내릴 수 있다
 * (서버가 강제하고 실패 시 403). 성공하면 상세 조회가 404가 되므로 화면을 떠난다.
 */
export function useArticleDeletion({
  articleId,
  groupId,
  onDeleted,
}: UseArticleDeletionProps) {
  const requestDeletion = useRequestDeletionMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const idempotencyKey = useRef<string | null>(null);

  const open = useCallback(() => {
    idempotencyKey.current = randomUUID();
    setErrorMessage(undefined);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    idempotencyKey.current = null;
    setErrorMessage(undefined);
    setIsOpen(false);
  }, []);

  const submit = useCallback(() => {
    if (requestDeletion.isPending) return;
    // 같은 내리기 시도의 재시도는 같은 키로 — 네트워크 실패 후 재전송이 두 번 기록되지 않게.
    idempotencyKey.current ??= randomUUID();
    setErrorMessage(undefined);

    requestDeletion.mutate(
      { articleId, groupId, idempotencyKey: idempotencyKey.current },
      {
        onSuccess: () => {
          close();
          onDeleted?.();
        },
        onError: (error) => setErrorMessage(toMessage(error)),
      },
    );
  }, [articleId, groupId, onDeleted, requestDeletion]);

  return {
    isOpen,
    open,
    close,
    submit,
    isPending: requestDeletion.isPending,
    errorMessage,
  };
}
