"use client";

import { ArrowRight, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useStackLinkRouter } from "stack-link";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { TextArea } from "@/components/common/shared/ui/TextArea";
import { useSession } from "@/components/common/shared/SessionProvider";
import { PublisherCheckGroup } from "@/components/feature/widget/PublisherCheckGroup";
import { useCreateReportMutation } from "@/hooks/features/query/mutations/useCreateReportMutation";
import { type OutletKey } from "@/lib/publishers";
import { randomUUID } from "@/lib/uuid";
import styles from "./page.module.css";

// 헤더(타이틀·닫기)는 네이티브 모달이 그린다 — apps/mobile의 ReportModal 스크린.
export default function ReportPage() {
  const { navigate } = useStackLinkRouter({});
  const { activeGroupId } = useSession();
  const createReport = useCreateReportMutation();
  const [text, setText] = useState("");
  // 언론사 선택은 제보자의 몫 — 5곳 중 최소 1곳을 직접 고른다(무작위 배정 없음).
  const [outletKeys, setOutletKeys] = useState<OutletKey[]>([]);

  const canSubmit =
    text.trim().length > 0 &&
    outletKeys.length > 0 &&
    !!activeGroupId &&
    !createReport.isPending;

  const submit = () => {
    if (!activeGroupId || createReport.isPending) return;
    const rawText = text.trim();
    if (!rawText || outletKeys.length === 0) return;
    createReport.mutate(
      {
        groupId: activeGroupId,
        rawText,
        outletKeys,
        idempotencyKey: randomUUID(),
      },
      {
        onSuccess: (draft) => {
          navigate({
            href: `/report/preview?reportId=${draft.report.id}`,
            animation: "slide",
          });
        },
      },
    );
  };

  const ctaLabel = createReport.isPending
    ? "기사 만드는 중…"
    : outletKeys.length === 0
      ? "언론사를 골라주세요"
      : `기사 ${outletKeys.length}개 만들기`;

  const footer = (
    <div className={styles.ctaBar}>
      <Button
        size="lg"
        className={styles.cta}
        disabled={!canSubmit}
        onClick={submit}
      >
        {ctaLabel}
        <ArrowRight size={17} aria-hidden />
      </Button>
    </div>
  );

  return (
    <MobileScreen footer={footer}>
      <div className={styles.body}>
        <TextArea
          label="무엇이 일어났나요?"
          maxLength={140}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="방금 무슨 일이 있었나요?"
        />
        <button type="button" className={styles.photoAdd}>
          <ImageIcon size={17} aria-hidden />
          <span>사진</span>
        </button>

        {createReport.isError && (
          <div className={styles.infoBox} role="alert">
            기사를 만들지 못했어요. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        <div className={styles.sectionLabel}>어느 언론사가 기사를 쓸까요?</div>
        <p className={styles.sectionHint}>원하는 곳을 골라주세요 (최소 1곳).</p>
        <PublisherCheckGroup
          aria-label="기사를 쓸 언론사"
          value={outletKeys}
          onChange={setOutletKeys}
        />
      </div>
    </MobileScreen>
  );
}
