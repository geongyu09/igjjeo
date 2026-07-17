/**
 * API 응답의 ISO 시각 문자열을 화면 컴포넌트가 쓰는 한국어 라벨로 변환한다.
 * 서버 wire 포맷(published_at·created_at)과 컴포넌트 props(timeLabel·byline) 사이의 얇은 변환 계층.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "방금" / "N분" / "N시간" / "N일" / "M월 D일" 상대 시각 라벨. */
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();

  if (Number.isNaN(diff)) return "";
  if (diff < MINUTE) return "방금";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일`;
  return `${then.getMonth() + 1}월 ${then.getDate()}일`;
}

/** "오전 10:24" 형태의 시:분 라벨. */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, "0");
  const meridiem = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${meridiem} ${hour12}:${minute}`;
}

/** 기사 상세 상단 모노 메타 ("특종 기자 · 오전 10:24 · 제보 김*규"). */
export function formatByline(
  reporterName: string,
  iso: string,
  maskedName: string,
): string {
  return `${reporterName} · ${formatClock(iso)} · 제보 ${maskedName}`;
}
