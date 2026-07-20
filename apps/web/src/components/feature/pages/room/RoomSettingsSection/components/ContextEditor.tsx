"use client";

import { Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/shared/ui/Button";
import { TextArea } from "@/components/common/shared/ui/TextArea";
import { useUpdateGroupMutation } from "@/hooks/features/query/mutations/useUpdateGroupMutation";
import styles from "../RoomSettingsSection.module.css";

interface ContextEditorProps {
  groupId: string;
  /** 방의 각색 키워드(컨텍스트). 없으면 null. */
  keyword: string | null;
  /** 방장만 수정할 수 있다. */
  canEdit: boolean;
}

/**
 * 방 컨텍스트(각색 키워드) 영역 — 모두에게 값을 보여주고, 방장에게만 인라인 수정을 연다.
 *
 * 저장(PATCH /groups/{id})에 성공하면 방 캐시가 갱신되어(useUpdateGroupMutation) 부모가
 * 최신 keyword 를 다시 내려주고 편집 모드를 닫는다. 빈 값으로 저장하면 컨텍스트가 지워진다.
 */
export function ContextEditor({
  groupId,
  keyword,
  canEdit,
}: ContextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(keyword ?? "");
  const mutation = useUpdateGroupMutation();

  const openEditor = () => {
    setDraft(keyword ?? "");
    setIsEditing(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    mutation.mutate(
      { groupId, keyword: draft.trim() },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  if (canEdit && isEditing) {
    return (
      <form className={styles.contextForm} onSubmit={submit} noValidate>
        <TextArea
          label="방 컨텍스트"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={100}
          placeholder="예) 지각 대장들, 야식 러버, 밤샘 코딩"
          autoFocus
        />
        <p className={styles.hint}>
          이 방의 기사를 각색할 때 참고돼요. 비워 두면 컨텍스트가 지워집니다.
        </p>

        {mutation.isError && (
          <p className={styles.error} role="alert">
            저장하지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        <div className={styles.contextActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditing(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "저장 중…" : "저장"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.context}>
      {keyword ? (
        <p className={styles.contextValue}>{keyword}</p>
      ) : (
        <p className={styles.contextEmpty}>아직 컨텍스트가 없어요</p>
      )}
      {canEdit && (
        <button
          type="button"
          className={styles.editButton}
          onClick={openEditor}
        >
          <Pencil size={12} aria-hidden />
          {keyword ? "컨텍스트 수정" : "컨텍스트 추가"}
        </button>
      )}
    </div>
  );
}
