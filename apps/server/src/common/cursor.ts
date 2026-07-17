/**
 * 커서 페이지네이션용 불투명 커서 코덱(conventions.md §6). 정렬키 값을
 * base64url 로 감싸 클라이언트가 내부 구조에 의존하지 못하게 한다.
 */
export function encodeCursor(sortValue: string): string {
  return Buffer.from(sortValue, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined | null): string | null {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    // base64url 은 임의 문자열을 관대하게 받아들이므로, round-trip 이 맞는지로 검증한다.
    if (Buffer.from(decoded, "utf8").toString("base64url") !== cursor) {
      return null;
    }
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}
