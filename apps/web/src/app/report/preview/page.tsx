"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/common/shared/ui/Button";
import { ConfirmDialog } from "@/components/common/shared/ui/ConfirmDialog";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { LoadingScreen } from "@/components/common/shared/ui/LoadingScreen";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { ArticlePreview } from "@/components/feature/widget/ArticlePreview";
import { useStackBack } from "@/hooks/common/useStackBack";
import { useCloseReportModal } from "@/hooks/features/report/useCloseReportModal";
import { useReportDraftSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useReportDraftSuspenseQuery";
import { usePublishReportMutation } from "@/hooks/features/query/mutations/usePublishReportMutation";
import { PUBLISHERS, type OutletKey } from "@/lib/publishers";
import { randomUUID } from "@/lib/uuid";
import styles from "./page.module.css";

export default function PublishPreviewPage() {
  // useSearchParams는 Suspense 경계가 필요하다.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PreviewRoute />
    </Suspense>
  );
}

function PreviewRoute() {
  const reportId = useSearchParams().get("reportId");
  const back = useStackBack();

  if (!reportId) {
    return (
      <MobileScreen
        header={<ScreenHeader title="이렇게 나왔어요" onBack={back} />}
      >
        <div className={styles.body}>
          <EmptyState
            title="초안을 찾을 수 없어요"
            description="제보 화면에서 다시 시작해 주세요."
            action={
              <Button variant="secondary" size="md" onClick={back}>
                돌아가기
              </Button>
            }
          />
        </div>
      </MobileScreen>
    );
  }

  return (
    <QueryBoundary
      pending={
        <MobileScreen
          header={<ScreenHeader title="이렇게 나왔어요" onBack={back} />}
        >
          <LoadingScreen />
        </MobileScreen>
      }
    >
      <PreviewContent reportId={reportId} />
    </QueryBoundary>
  );
}

function PreviewContent({ reportId }: { reportId: string }) {
  const back = useStackBack();
  const closeReportModal = useCloseReportModal();
  const { data: draft } = useReportDraftSuspenseQuery({ reportId });
  const publish = usePublishReportMutation();

  const drafts = draft.draft_articles;
  const [current, setCurrent] = useState<OutletKey>(
    () => drafts[0]?.outlet_key,
  );
  // 발행 없이 이 화면을 벗어나면 발행 횟수만 차감된다 — 이탈 전 한 번 더 확인받는다.
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const requestExit = () => setExitConfirmOpen(true);

  const index = Math.max(
    drafts.findIndex((item) => item.outlet_key === current),
    0,
  );
  const article = drafts[index];

  const doPublish = () => {
    if (publish.isPending || drafts.length === 0) return;
    publish.mutate(
      {
        reportId,
        outletKeys: drafts.map((item) => item.outlet_key),
        idempotencyKey: randomUUID(),
      },
      // 발행 완료 → 네이티브 제보 모달을 닫는다(브라우저는 피드로 폴백).
      { onSuccess: closeReportModal },
    );
  };

  const footer = (
    <div className={styles.ctaBar}>
      <Button variant="secondary" size="lg" onClick={requestExit}>
        언론사 변경
      </Button>
      <Button
        size="lg"
        className={styles.publish}
        disabled={publish.isPending || drafts.length === 0}
        onClick={doPublish}
      >
        {publish.isPending ? "발행 중…" : `${drafts.length}개 모두 발행`}
      </Button>
    </div>
  );

  if (!article) {
    return (
      <MobileScreen
        header={<ScreenHeader title="이렇게 나왔어요" onBack={back} />}
      >
        <div className={styles.body}>
          <EmptyState
            title="아직 초안이 없어요"
            description="다시 각색을 시도해 주세요."
          />
        </div>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen
      header={<ScreenHeader title="이렇게 나왔어요" onBack={requestExit} />}
      footer={footer}
    >
      <ConfirmDialog
        open={exitConfirmOpen}
        title="정말 나가시겠어요?"
        description="여기서 나가도 이미 만든 발행 횟수만 차감돼요. 발행하지 않으면 기사는 방에 올라가지 않아요."
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        confirmVariant="secondary"
        onConfirm={() => {
          setExitConfirmOpen(false);
          back();
        }}
        onCancel={() => setExitConfirmOpen(false)}
      />
      <div className={styles.body}>
        <div className={styles.pager}>
          <span>
            {drafts.length}개 중{" "}
            <b>
              {index + 1} / {drafts.length}
            </b>
          </span>
          <span className={styles.hint}>← 넘겨서 비교 →</span>
        </div>

        <div className={styles.tabRow} role="tablist" aria-label="언론사 선택">
          {drafts.map((item) => {
            const active = item.outlet_key === current;
            return (
              <button
                key={item.outlet_key}
                type="button"
                role="tab"
                aria-selected={active}
                data-outlet={item.outlet_key}
                data-active={active ? "" : undefined}
                className={styles.tab}
                onClick={() => setCurrent(item.outlet_key)}
              >
                {PUBLISHERS[item.outlet_key].name}
              </button>
            );
          })}
        </div>

        <ArticlePreview
          outlet={article.outlet_key}
          headline={article.headline}
          body={article.body}
          byline={`${article.reporter_name} 기자`}
        />
      </div>
    </MobileScreen>
  );
}
