/**
 * 초대 코드·초대 링크 유틸.
 *
 * 초대 코드는 방(그룹)마다 발급되는 짧은 영숫자 문자열(예: `B3QFNS`)이다. 링크로 공유되고
 * (`/?invite=<코드>`), 앱은 딥링크(Universal/App Links)로 같은 링크를 받아 방에 참여시킨다.
 * 사용자·딥링크·수동 입력 등 여러 경로로 들어오므로 한 곳에서 정규화·검증한다.
 */

/** 초대 코드 최대 길이 — 이보다 길면 코드가 아니라고 본다(오염된 쿼리 방지). */
const MAX_INVITE_CODE_LENGTH = 16;

/**
 * 초대 코드를 정규화한다 — 공백 제거, 대문자화, 영숫자 외 문자 제거.
 * 유효한 코드가 남지 않거나 과도하게 길면 null.
 */
export function normalizeInviteCode(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === 0 || cleaned.length > MAX_INVITE_CODE_LENGTH) {
    return null;
  }
  return cleaned;
}

/** origin과 초대 코드로 공유용 초대 링크를 만든다(`<origin>/?invite=<코드>`). */
export function buildInviteLink(origin: string, code: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/?invite=${code}`;
}
