"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/common/shared/ui/Button";
import { SegmentedControl } from "@/components/common/shared/ui/SegmentedControl";
import { TextArea } from "@/components/common/shared/ui/TextArea";
import {
  CORRECTION_TEXT_MAX_LENGTH,
  type CorrectionRequestInput,
} from "@/lib/corrections";
import styles from "./CorrectionRequestSheet.module.css";

type CorrectionKind = "subject" | "third_party";

const KIND_OPTIONS: { value: CorrectionKind; label: string }[] = [
  { value: "subject", label: "제 얘기예요" },
  { value: "third_party", label: "제가 목격했어요" },
];

/**
 * 당사자/제3자의 차이를 요청 전에 알려준다 — 둘은 결과가 다르다(ai-rules.md).
 * 어느 쪽이든 원 기사는 내려가지 않는다는 점을 분명히 한다.
 */
const KIND_HINT: Record<CorrectionKind, string> = {
  subject:
    "같은 언론사가 “본지는 앞선 보도를 정정합니다” 기사를 하나 더 냅니다. 원 기사는 그대로 남아요.",
  third_party:
    "새 제보로 취급돼 언론사들이 새 기사를 냅니다. 원 기사와 나란히 남아요.",
};

export interface CorrectionRequestSheetProps {
  /** 열림 여부 (controlled). 열릴 때마다 입력이 초기화된다. */
  open: boolean;
  /** 각색 진행 중 — 제출을 잠근다. */
  pending?: boolean;
  /** 한도 초과·각색 거부 등 서버가 돌려준 실패 안내. */
  errorMessage?: string;
  onSubmit: (input: CorrectionRequestInput) => void;
  onClose: () => void;
}

/**
 * 정정 요청 입력 시트 — 당사자/제3자를 고르고 정정 내용을 적어 요청한다.
 * 기사 상세·정정 연쇄 양쪽에서 쓰므로 widget 레벨에 둔다.
 */
export function CorrectionRequestSheet({
  open,
  pending = false,
  errorMessage,
  onSubmit,
  onClose,
}: CorrectionRequestSheetProps) {
  const [kind, setKind] = useState<CorrectionKind>("subject");
  const [text, setText] = useState("");
  const titleId = useId();

  // 열 때마다 새 요청 — 직전 입력이 남아 실수로 제출되지 않게 초기화한다.
  useEffect(() => {
    if (open) {
      setKind("subject");
      setText("");
    }
  }, [open]);

  // Escape로 닫기. 각색이 도는 중에는 닫지 않는다(요청은 이미 나갔다).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open || typeof document === "undefined") return null;

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={styles.title} id={titleId}>
          정정 요청
        </h2>

        <SegmentedControl
          className={styles.kind}
          options={KIND_OPTIONS}
          value={kind}
          onChange={setKind}
          aria-label="정정 요청 유형"
        />
        <p className={styles.hint}>{KIND_HINT[kind]}</p>

        <TextArea
          label="정정 내용"
          placeholder="무엇이 사실과 다른가요?"
          maxLength={CORRECTION_TEXT_MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          disabled={pending}
          // 시트가 열린 사실이 스크린리더에도 전달되도록 입력에 포커스를 옮긴다.
          autoFocus
        />

        {errorMessage && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}

        <div className={styles.actions}>
          <Button
            className={styles.action}
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            취소
          </Button>
          <Button
            className={styles.action}
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                isSubject: kind === "subject",
                correctionText: trimmed,
              })
            }
          >
            정정 요청
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
