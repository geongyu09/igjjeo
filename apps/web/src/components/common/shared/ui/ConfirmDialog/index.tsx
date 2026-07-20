"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  type ButtonVariant,
} from "@/components/common/shared/ui/Button";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  /** 다이얼로그 표시 여부 (controlled). */
  open: boolean;
  title: string;
  description?: ReactNode;
  /** 확인(진행) 버튼 문구. 기본값 "확인". */
  confirmLabel?: string;
  /** 취소(머무름) 버튼 문구. 기본값 "취소". */
  cancelLabel?: string;
  /** 확인 버튼의 시각 강조. 기본값 "primary". */
  confirmVariant?: ButtonVariant;
  /** 확인 버튼을 눌렀을 때 (진행). */
  onConfirm: () => void;
  /** 취소 버튼·Escape·배경 클릭 시 (머무름). */
  onCancel: () => void;
}

/**
 * 되돌릴 수 없는 동작 전에 한 번 더 확인받는 경고 다이얼로그.
 * 열림 상태는 부모가 소유하는 controlled 컴포넌트 (shared/ui 추상화 레벨).
 *
 * - 안전한 기본값(취소)에 포커스를 두고, Escape·배경 클릭도 취소로 처리한다.
 * - 사용자 상호작용으로만 열리므로(초기 렌더 시 항상 닫힘) document 가드만으로 포탈을 연다.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Escape로 취소.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  // 닫혀 있거나 서버 렌더(document 없음) 중이면 렌더하지 않는다.
  // 이 다이얼로그는 사용자 상호작용으로만 열리므로 초기 하이드레이션 시엔 항상 닫혀 있다.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.overlay}
      data-testid="confirm-dialog-overlay"
      onClick={onCancel}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>
        {description ? (
          <p id="confirm-dialog-desc" className={styles.description}>
            {description}
          </p>
        ) : null}
        <div className={styles.actions}>
          <Button
            // 안전한 기본값(취소)에 포커스 — 다이얼로그는 열릴 때마다 새로 마운트된다.
            autoFocus
            variant="secondary"
            size="lg"
            className={styles.action}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="lg"
            className={styles.action}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
