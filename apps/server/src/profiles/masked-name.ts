/**
 * 표시 이름 → 마스킹 이름 파생 (서버가 생성, 클라이언트 위조 방지).
 *
 * 규칙(auth-profile.md):
 * - 3글자 "홍길동" → 가운데 한 글자 마스킹 "홍*동"
 * - 2글자 "김구" → 마지막 글자 마스킹 "김*"
 * - 4글자 이상 "남궁민수" → 가운데 전부 마스킹 "남**수"
 * - 1글자는 마스킹할 가운데가 없어 그대로 둔다.
 *
 * 서로게이트 페어(이모지 등)를 한 글자로 세도록 코드 포인트 단위로 처리한다.
 */
export function deriveMaskedName(displayName: string): string {
  const chars = [...displayName.trim()];
  const n = chars.length;

  if (n <= 1) {
    return chars.join("");
  }
  if (n === 2) {
    return `${chars[0]}*`;
  }

  return `${chars[0]}${"*".repeat(n - 2)}${chars[n - 1]}`;
}
