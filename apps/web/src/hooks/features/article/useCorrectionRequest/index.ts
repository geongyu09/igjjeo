"use client";

import { useCallback, useRef, useState } from "react";
import { useRequestCorrectionMutation } from "@/hooks/features/query/mutations/useRequestCorrectionMutation";
import { isApiError } from "@/lib/api/errors";
import type { CorrectionRequestInput } from "@/lib/corrections";
import { randomUUID } from "@/lib/uuid";

export interface UseCorrectionRequestProps {
  articleId: string;
}

/** 실패 사유를 화면 문구로 옮긴다. 서버 문구가 그대로 쓸 만한 경우엔 그것을 쓴다. */
function toMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "정정 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.";
  }
  switch (error.code) {
    case "rate_limited":
      return error.message || "하루 정정 한도(5회)를 모두 사용했어요";
    case "adaptation_refused":
      return "이 내용은 각색할 수 없어요. 외모·능력 평가는 기사로 쓰지 않아요.";
    case "ai_unavailable":
      return "지금은 기사를 쓸 수 없어요. 잠시 후 다시 시도해 주세요.";
    default:
      return error.message || "정정 요청을 보내지 못했어요.";
  }
}

/**
 * 기사 정정 요청 흐름 — 시트 열림·실패 안내·멱등 키를 함께 관리한다.
 *
 * 정정은 AI 각색을 부르므로 재시도가 중복 각색이 되지 않도록 **한 번의 요청 사이클 동안
 * 같은 멱등 키**를 유지하고, 시트를 새로 열 때만 키를 새로 만든다(conventions.md §8).
 */
export function useCorrectionRequest({ articleId }: UseCorrectionRequestProps) {
  const requestCorrection = useRequestCorrectionMutation();
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

  const submit = useCallback(
    ({ isSubject, correctionText }: CorrectionRequestInput) => {
      if (requestCorrection.isPending) return;
      idempotencyKey.current ??= randomUUID();
      setErrorMessage(undefined);

      requestCorrection.mutate(
        {
          articleId,
          isSubject,
          correctionText,
          idempotencyKey: idempotencyKey.current,
        },
        {
          onSuccess: () => close(),
          // 실패해도 시트는 닫지 않는다 — 적은 내용을 잃지 않고 그대로 다시 보낼 수 있어야 한다.
          onError: (error) => {
            // 4xx는 같은 요청을 다시 보내도 결과가 같다(각색 거부·한도 초과). 내용을 고쳐 보낼
            // 요청이므로 키를 버린다 — 같은 키로 다른 본문을 보내면 서버가 최초 결과를 재생한다.
            if (isApiError(error) && error.status < 500) {
              idempotencyKey.current = null;
            }
            setErrorMessage(toMessage(error));
          },
        },
      );
    },
    [articleId, close, requestCorrection],
  );

  return {
    isOpen,
    open,
    close,
    submit,
    isPending: requestCorrection.isPending,
    errorMessage,
  };
}
