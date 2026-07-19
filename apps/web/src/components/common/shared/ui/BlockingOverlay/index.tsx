import styles from "./BlockingOverlay.module.css";

export interface BlockingOverlayProps {
  /** 열림 여부. false면 아무 것도 렌더링하지 않는다. */
  open: boolean;
  /** 무엇을 기다리는지 알리는 문구 */
  message: string;
  /** 보조 설명 (선택) */
  description?: string;
}

/**
 * 화면 전체를 덮어 조작을 막는 오버레이 — 되돌릴 수 없는 작업이 끝날 때까지 기다리게 한다.
 * 뒤 화면의 포인터 이벤트를 자신이 모두 받아 삼키므로, 뒤 요소를 별도로 비활성화하지 않아도
 * 터치·클릭이 통과하지 않는다. 키보드·스크린리더 차단은 호출부가 `inert`로 함께 처리한다.
 */
export function BlockingOverlay({
  open,
  message,
  description,
}: BlockingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={message}
      // 오버레이 위에서 발생한 이벤트가 뒤로 새어나가지 않게 한다.
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.panel}>
        <span className={styles.spinner} aria-hidden />
        <p className={styles.message}>{message}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
  );
}
