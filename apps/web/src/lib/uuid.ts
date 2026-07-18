/**
 * RFC 4122 v4 UUID 생성.
 *
 * `crypto.randomUUID`는 secure context(HTTPS·localhost)에서만 제공된다.
 * 실기기 WebView가 LAN IP(http://192.168.x.x)로 웹에 접속하면 secure context가
 * 아니라 `crypto.randomUUID`가 없다 — 이때는 non-secure context에서도 제공되는
 * `crypto.getRandomValues`로 폴백해 유효한 v4 UUID를 만든다.
 */
export function randomUUID(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // 일부 환경은 randomUUID 접근/호출 자체가 throw — 폴백으로 넘어간다.
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
