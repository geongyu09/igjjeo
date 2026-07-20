/**
 * 초대 링크를 브라우저에서 연 사용자에게 어떤 설치 경로를 제시할지 판별한다.
 * 앱은 아직 스토어에 없으므로 설치 대상은 Android=APK 직접 다운로드, iOS=TestFlight다.
 */

export type InstallPlatform = "ios" | "android" | "other";

/**
 * User-Agent(+ 터치 포인트)로 설치 플랫폼을 판별한다.
 *
 * iPadOS는 데스크톱 Safari와 같은 UA(Macintosh)를 보내므로, Mac UA + 터치가 있으면
 * iOS(iPad)로 본다.
 */
export function resolveInstallPlatform(
  userAgent: string,
  { maxTouchPoints = 0 }: { maxTouchPoints?: number } = {},
): InstallPlatform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  // iPadOS 13+ 는 "Macintosh" UA를 쓰므로 터치 지원 여부로 구분한다.
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "other";
}
