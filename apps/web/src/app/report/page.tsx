"use client";

import { ArrowRight, Dices, ImageIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useStackLinkRouter } from "stack-link";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { SegmentedControl } from "@/components/common/shared/ui/SegmentedControl";
import { TextArea } from "@/components/common/shared/ui/TextArea";
import { useSession } from "@/components/common/shared/SessionProvider";
import { AssignedOutletList } from "@/components/feature/widget/AssignedOutletList";
import { useCreateReportMutation } from "@/hooks/features/query/mutations/useCreateReportMutation";
import { OUTLET_KEYS, type OutletKey } from "@/lib/publishers";
import styles from "./page.module.css";

type Mode = "choose" | "random";

function pickThree(): OutletKey[] {
  const pool = [...OUTLET_KEYS];
  const picked: OutletKey[] = [];
  while (picked.length < 3) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

// 헤더(타이틀·닫기)는 네이티브 모달이 그린다 — apps/mobile의 ReportModal 스크린.
export default function ReportPage() {
  const { navigate } = useStackLinkRouter({});
  const { activeGroupId } = useSession();
  const createReport = useCreateReportMutation();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("random");
  const [assigned, setAssigned] = useState<OutletKey[]>(() => pickThree());

  const canSubmit =
    text.trim().length > 0 && !!activeGroupId && !createReport.isPending;

  const submit = () => {
    if (!activeGroupId || createReport.isPending) return;
    const rawText = text.trim();
    if (!rawText) return;
    createReport.mutate(
      {
        groupId: activeGroupId,
        rawText,
        outletKeys: assigned,
        idempotencyKey: crypto.randomUUID(),
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

  const footer = (
    <div className={styles.ctaBar}>
      <Button
        size="lg"
        className={styles.cta}
        disabled={!canSubmit}
        onClick={submit}
      >
        {createReport.isPending ? "기사 만드는 중…" : "기사 3개 만들기"}
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

        <div className={styles.sectionLabel}>누가 기사를 쓸까요?</div>
        <SegmentedControl<Mode>
          aria-label="각색 방식"
          value={mode}
          onChange={setMode}
          className={styles.modeToggle}
          options={[
            { value: "choose", label: "내가 고르기" },
            { value: "random", label: "무작위 3곳" },
          ]}
        />

        {mode === "random" ? (
          <>
            <div className={styles.infoBox}>
              이번 제보엔 <b>이 세 곳</b>이 무작위로 붙었어요. 발행하면 서로
              다른 각도의 기사 3개가 한 번에 나와요.
            </div>
            <AssignedOutletList assigned={assigned} />
            <button
              type="button"
              className={styles.reshuffle}
              onClick={() => setAssigned(pickThree())}
            >
              <RefreshCw size={14} aria-hidden />
              다시 뽑기
            </button>
          </>
        ) : (
          <div className={styles.infoBox}>
            <Dices size={14} aria-hidden /> 직접 고르기는 준비 중이에요. 지금은
            무작위 3곳으로 진행돼요.
          </div>
        )}
      </div>
    </MobileScreen>
  );
}
