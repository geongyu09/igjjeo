/**
 * CORS 허용 오리진 판정. 브라우저에서 오는 요청만 대상이며,
 * 허용 목록에 없는 오리진은 막는다(요청 오리진을 그대로 반사하지 않는다).
 */

export interface OriginPolicy {
  /** 허용 오리진. 호스트 첫 라벨에 한해 `*` 와일드카드를 쓸 수 있다. */
  allowList: string[];
  /** localhost·사설 IP 를 목록 없이 허용할지 (로컬 개발·실기기 웹뷰용). */
  allowLocalNetwork: boolean;
}

/** `A,B` 형태의 환경변수를 오리진 배열로 만든다. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);
}

/** 사설망 여부 — 로컬 개발과 실기기 웹뷰(LAN IP)를 위한 예외. */
function isLocalNetworkHost(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  ) {
    return true;
  }

  // 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12
  return (
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

/**
 * 와일드카드 오리진 매칭. `*` 는 호스트의 한 라벨 안에서만 확장되므로
 * `https://app-*.vercel.app` 이 `app-x.vercel.app.evil.com` 이나
 * `app-x.evil.vercel.app` 에 매칭되지 않는다.
 */
function matchesPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes("*")) {
    return origin === pattern;
  }

  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^./]*");

  return new RegExp(`^${escaped}$`).test(origin);
}

export function isOriginAllowed(
  origin: string | undefined,
  policy: OriginPolicy,
): boolean {
  // Origin 이 없는 요청은 브라우저발이 아니다(네이티브 앱·서버간 호출·curl).
  // CORS 로 막을 대상이 아니므로 통과시킨다.
  if (!origin) {
    return true;
  }

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  if (policy.allowList.some((pattern) => matchesPattern(origin, pattern))) {
    return true;
  }

  return policy.allowLocalNetwork && isLocalNetworkHost(hostname);
}
