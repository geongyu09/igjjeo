// 초대 딥링크 파싱. 두 형태를 모두 처리한다:
//   - Universal/App Link: https://igjjeo-web.vercel.app/?invite=<코드>
//   - 커스텀 스킴(브라우저 "앱에서 열기"): igjjeo://invite?code=<코드>
// React Native의 URL 구현이 불완전할 수 있어(searchParams 미지원 등) 수동으로 파싱한다.
// 초대 코드 정규화 규칙은 웹(apps/web src/lib/invite.ts)과 동일하게 유지한다.

const MAX_INVITE_CODE_LENGTH = 16;

/** 공백 제거·대문자화·영숫자 외 제거. 유효하지 않으면 null. */
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

function getQueryParam(query: string, key: string): string | null {
  for (const pair of query.split("&")) {
    if (pair.length === 0) continue;
    const eq = pair.indexOf("=");
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawValue = eq === -1 ? "" : pair.slice(eq + 1);
    let decodedKey: string;
    try {
      decodedKey = decodeURIComponent(rawKey);
    } catch {
      decodedKey = rawKey;
    }
    if (decodedKey === key) {
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }
  return null;
}

/**
 * 딥링크 URL에서 초대 코드를 추출한다(없으면 null).
 * 쿼리 `invite`(Universal Link) 또는 `code`(커스텀 스킴)를 본다.
 */
export function parseInviteFromUrl(url: string): string | null {
  if (!url) return null;
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return null;
  // 프래그먼트(#) 이후는 버린다.
  const hashIndex = url.indexOf("#", queryIndex);
  const query =
    hashIndex === -1
      ? url.slice(queryIndex + 1)
      : url.slice(queryIndex + 1, hashIndex);
  const code = getQueryParam(query, "invite") ?? getQueryParam(query, "code");
  return normalizeInviteCode(code);
}

/** 초대 코드로 앱이 열 웹 라우트 경로를 만든다(`/group?invite=<코드>`). */
export function inviteWebPath(code: string): string {
  return `/group?invite=${code}`;
}
