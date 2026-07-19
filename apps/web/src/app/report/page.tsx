"use client";

import { ArrowRight, ImageIcon, Megaphone } from "lucide-react";
import { useState } from "react";
import { useStackLinkRouter } from "stack-link";
import { BlockingOverlay } from "@/components/common/shared/ui/BlockingOverlay";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { TextArea } from "@/components/common/shared/ui/TextArea";
import { useSession } from "@/components/common/shared/SessionProvider";
import { useToast } from "@/components/common/shared/ui/Toast";
import { PublisherCheckGroup } from "@/components/feature/widget/PublisherCheckGroup";
import { useCreateReportMutation } from "@/hooks/features/query/mutations/useCreateReportMutation";
import { useReportQuotaQuery } from "@/hooks/features/query/querys/useReportQuotaQuery";
import { useLockReportModal } from "@/hooks/features/report/useLockReportModal";
import { isApiError } from "@/lib/api/errors";
import { MAX_OUTLET_SELECTION, type OutletKey } from "@/lib/publishers";
import { randomUUID } from "@/lib/uuid";
import styles from "./page.module.css";

const CREATE_FAILED_MESSAGE =
  "기사를 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
const DAILY_LIMIT_FALLBACK_MESSAGE =
  "오늘 제보 한도를 모두 사용했어요. 내일 다시 시도해 주세요.";

/**
 * 하루 한도 소진(429 rate_limited)은 재시도로 풀리지 않으므로 일반 실패와 구분해 알린다.
 * 한도·리셋 시점은 서버가 아는 값이라 서버 메시지를 그대로 쓰고, 비어 있을 때만 대체 문구.
 */
function toastMessageForCreateError(error: unknown): string {
  if (isApiError(error) && error.code === "rate_limited") {
    return error.message.trim() || DAILY_LIMIT_FALLBACK_MESSAGE;
  }
  return CREATE_FAILED_MESSAGE;
}

// 헤더(타이틀·닫기)는 네이티브 모달이 그린다 — apps/mobile의 ReportModal 스크린.
export default function ReportPage() {
  const { navigate } = useStackLinkRouter({});
  const { activeGroupId } = useSession();
  const { showToast } = useToast();
  const createReport = useCreateReportMutation();
  const { data: quota } = useReportQuotaQuery();
  const [text, setText] = useState("");
  // 언론사 선택은 제보자의 몫 — 5곳 중 최소 1곳·최대 3곳을 직접 고른다(무작위 배정 없음).
  const [outletKeys, setOutletKeys] = useState<OutletKey[]>([]);

  // 각색은 한도를 차감하는 되돌릴 수 없는 요청이라, 진행 중에는 화면 조작과 모달 이탈을 모두 막는다.
  const isGenerating = createReport.isPending;
  useLockReportModal(isGenerating);

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
        onError: (error) => {
          showToast(toastMessageForCreateError(error));
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
      <BlockingOverlay
        open={isGenerating}
        message="기사를 만들고 있어요"
        description="곧 끝나요. 화면을 닫지 말고 잠시만 기다려 주세요."
      />
      {/* 오버레이가 터치를 막고, inert가 키보드·스크린리더 접근까지 막는다. */}
      <div className={styles.body} inert={isGenerating}>
        {quota && (
          <div
            className={styles.quotaBanner}
            role="status"
            data-empty={quota.remaining === 0}
          >
            <Megaphone size={15} className={styles.quotaIcon} aria-hidden />
            <span>
              {quota.remaining > 0
                ? `오늘 제보 한도 ${quota.limit}회 중 ${quota.remaining}회 남음`
                : `오늘 제보 한도 ${quota.limit}회를 모두 사용했어요`}
            </span>
          </div>
        )}
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

        <div className={styles.sectionLabel}>어느 언론사가 기사를 쓸까요?</div>
        <p className={styles.sectionHint}>
          원하는 곳을 골라주세요 (최소 1곳, 최대 {MAX_OUTLET_SELECTION}곳).
        </p>
        <PublisherCheckGroup
          aria-label="기사를 쓸 언론사"
          value={outletKeys}
          max={MAX_OUTLET_SELECTION}
          onChange={setOutletKeys}
        />
      </div>
    </MobileScreen>
  );
}
