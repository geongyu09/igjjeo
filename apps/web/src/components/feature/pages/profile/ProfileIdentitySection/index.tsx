"use client";

import { Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { Button } from "@/components/common/shared/ui/Button";
import { TextField } from "@/components/common/shared/ui/TextField";
import { useUpdateProfileMutation } from "@/hooks/features/query/mutations/useUpdateProfileMutation";
import styles from "./ProfileIdentitySection.module.css";

/**
 * 프로필 상단의 신원 영역 — 아바타와 이름을 보여주고, 이름(닉네임)을 인라인으로 수정한다.
 *
 * 저장(PATCH /me)에 성공하면 me 캐시가 갱신되어(useUpdateProfileMutation) 부모가 최신
 * displayName 을 다시 내려주고, 편집 모드를 닫는다.
 */
export function ProfileIdentitySection({
  displayName,
}: {
  displayName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className={styles.identity}>
        <Avatar name={displayName} size="lg" emphasized />
        <div>
          <div className={styles.name}>{displayName}</div>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={12} aria-hidden />
            이름 수정
          </button>
        </div>
      </div>
    );
  }

  return (
    <NameEditForm
      currentName={displayName}
      onClose={() => setIsEditing(false)}
    />
  );
}

function NameEditForm({
  currentName,
  onClose,
}: {
  currentName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  const mutation = useUpdateProfileMutation();
  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !mutation.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({ displayName: trimmed }, { onSuccess: onClose });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        label="이름"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="name"
        placeholder="예) 김건규"
        autoFocus
      />

      {mutation.isError && (
        <p className={styles.error} role="alert">
          저장하지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          취소
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {mutation.isPending ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
