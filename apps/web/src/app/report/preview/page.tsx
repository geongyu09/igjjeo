"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useStackLinkRouter } from "stack-link";
import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { ArticlePreview } from "@/components/feature/widget/ArticlePreview";
import { useStackBack } from "@/hooks/common/useStackBack";
import { DRAFT_PREVIEW } from "@/lib/mock";
import { PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./page.module.css";

export default function PublishPreviewPage() {
  const back = useStackBack();
  const { navigate } = useStackLinkRouter({});
  const [current, setCurrent] = useState<OutletKey>(DRAFT_PREVIEW[0].outlet);

  const index = DRAFT_PREVIEW.findIndex((a) => a.outlet === current);
  const article = DRAFT_PREVIEW[index];

  const footer = (
    <div className={styles.ctaBar}>
      <Button variant="secondary" size="lg" onClick={back}>
        언론사 변경
      </Button>
      <Button size="lg" className={styles.publish} onClick={() => navigate({ href: "/", animation: "none" })}>
        3개 모두 발행
      </Button>
    </div>
  );

  return (
    <MobileScreen
      header={<ScreenHeader title="이렇게 나왔어요" onBack={back} />}
      footer={footer}
    >
      <div className={styles.body}>
        <div className={styles.pager}>
          <span>
            3개 중 <b>{index + 1} / 3</b>
          </span>
          <span className={styles.hint}>← 넘겨서 비교 →</span>
        </div>

        <div className={styles.tabRow} role="tablist" aria-label="언론사 선택">
          {DRAFT_PREVIEW.map((a) => {
            const active = a.outlet === current;
            return (
              <button
                key={a.outlet}
                type="button"
                role="tab"
                aria-selected={active}
                data-outlet={a.outlet}
                data-active={active ? "" : undefined}
                className={styles.tab}
                onClick={() => setCurrent(a.outlet)}
              >
                {PUBLISHERS[a.outlet].name}
              </button>
            );
          })}
        </div>

        <ArticlePreview
          outlet={article.outlet}
          headline={article.headline}
          body={article.body}
          byline={article.byline}
        />

        <button type="button" className={styles.regenerate}>
          <RefreshCw size={15} aria-hidden />이 기사만 다시 생성
        </button>
      </div>
    </MobileScreen>
  );
}
