import { Avatar } from "@/components/common/shared/ui/Avatar";
import styles from "./CommentThread.module.css";

export interface CommentItem {
  id: string;
  /** 작성자 마스킹 이름 ("이*아") */
  authorLabel: string;
  timeLabel: string;
  body: string;
}

export interface CommentThreadProps {
  comments: CommentItem[];
  className?: string;
}

export function CommentThread({ comments, className }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className={[styles.empty, className].filter(Boolean).join(" ")}>
        첫 댓글을 남겨보세요
      </div>
    );
  }

  return (
    <ul className={[styles.thread, className].filter(Boolean).join(" ")}>
      {comments.map((comment) => (
        <li key={comment.id} className={styles.item}>
          <Avatar name={comment.authorLabel} size="sm" />
          <div>
            <div className={styles.meta}>
              {comment.authorLabel}{" "}
              <span className={styles.time}>· {comment.timeLabel}</span>
            </div>
            <p className={styles.body}>{comment.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
