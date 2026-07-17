"use client";

import { ArrowUp, MoreHorizontal } from "lucide-react";
import { use, useState } from "react";
import { StackLink } from "stack-link";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { CommentThread } from "@/components/feature/widget/CommentThread";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { ReactionBar } from "@/components/feature/widget/ReactionBar";
import { TrustBar } from "@/components/feature/widget/TrustBar";
import { useStackBack } from "@/hooks/common/useStackBack";
import { useArticleSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useArticleSuspenseQuery";
import { useArticleCommentsSuspenseQuery } from "@/hooks/features/query/suspenseQuerys/useArticleCommentsSuspenseQuery";
import { useAddReactionMutation } from "@/hooks/features/query/mutations/useAddReactionMutation";
import { useRemoveReactionMutation } from "@/hooks/features/query/mutations/useRemoveReactionMutation";
import { useCreateCommentMutation } from "@/hooks/features/query/mutations/useCreateCommentMutation";
import { formatByline, formatRelativeTime } from "@/lib/datetime";
import type { ReactionType } from "@/lib/reactions";
import styles from "./page.module.css";

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <QueryBoundary>
      <ArticleContent id={id} />
    </QueryBoundary>
  );
}

function ArticleContent({ id }: { id: string }) {
  const back = useStackBack();
  const { data: article } = useArticleSuspenseQuery({ articleId: id });
  const { data: commentsData } = useArticleCommentsSuspenseQuery({
    articleId: id,
  });
  const addReaction = useAddReactionMutation();
  const removeReaction = useRemoveReactionMutation();
  const createComment = useCreateCommentMutation();
  const [draft, setDraft] = useState("");

  const counts = article.reaction_counts;
  const myReaction = article.my_reactions[0] ?? null;

  const react = (type: ReactionType) => {
    if (article.my_reactions.includes(type)) {
      removeReaction.mutate({ articleId: id, reactionType: type });
    } else {
      addReaction.mutate({ articleId: id, reactionType: type });
    }
  };

  const comments = commentsData.pages
    .flatMap((page) => page.items)
    .map((comment) => ({
      id: comment.id,
      authorLabel: comment.author.masked_name,
      timeLabel: formatRelativeTime(comment.created_at),
      body: comment.body,
    }));

  const submitComment = () => {
    const body = draft.trim();
    if (!body || createComment.isPending) return;
    createComment.mutate(
      { articleId: id, body },
      { onSuccess: () => setDraft("") },
    );
  };

  const header = (
    <ScreenHeader
      title={<PublisherBadge outlet={article.outlet_key} />}
      onBack={back}
      trailing={
        <button type="button" className={styles.moreButton} aria-label="더보기">
          <MoreHorizontal size={22} aria-hidden />
        </button>
      }
    />
  );

  const footer = (
    <div className={styles.composer}>
      <input
        className={styles.commentInput}
        placeholder="댓글 달기…"
        aria-label="댓글"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submitComment();
          }
        }}
      />
      <button
        type="button"
        className={styles.sendButton}
        aria-label="댓글 보내기"
        disabled={draft.trim().length === 0 || createComment.isPending}
        onClick={submitComment}
      >
        <ArrowUp size={19} aria-hidden />
      </button>
    </div>
  );

  return (
    <MobileScreen header={header} footer={footer}>
      <div className={styles.body}>
        <h1 className={styles.headline}>{article.headline}</h1>
        <div className={styles.byline}>
          {formatByline(
            article.reporter_name,
            article.published_at,
            article.reporter.masked_name,
          )}
        </div>
        <div className={styles.photo} aria-hidden>
          사진
        </div>
        <p className={styles.article}>{article.body}</p>

        <TrustBar
          className={styles.trust}
          admitCount={counts.admit}
          reallyCount={counts.really}
          total={Math.max(counts.admit + counts.really, 10)}
        />

        <ReactionBar counts={counts} myReaction={myReaction} onReact={react} />

        <StackLink href={`/article/${id}/thread`} preLoad animation="slide">
          <button type="button" className={styles.correctionCta}>
            사실과 다르다면?{" "}
            <span className={styles.correctionLink}>정정 요청 →</span>
          </button>
        </StackLink>

        <div className={styles.comments}>
          <CommentThread comments={comments} />
        </div>
      </div>
    </MobileScreen>
  );
}
