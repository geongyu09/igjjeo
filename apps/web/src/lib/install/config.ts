/**
 * 앱 설치·앱 열기 관련 상수. 스토어 URL은 빌드 타임 공개 환경변수로 주입한다
 * (앱이 아직 스토어에 없어 Android=APK 직접 다운로드, iOS=TestFlight).
 */

/** 커스텀 URL 스킴 — 브라우저에서 "앱에서 열기"로 설치된 앱을 직접 띄운다. app.json의 scheme과 일치. */
export const APP_URL_SCHEME = "igjjeo";

/** Android APK 직접 다운로드 URL(미설정 시 빈 문자열). */
export function androidApkUrl(): string {
  return process.env.NEXT_PUBLIC_ANDROID_APK_URL ?? "";
}

/** iOS TestFlight 초대 URL(미설정 시 빈 문자열). */
export function iosTestflightUrl(): string {
  return process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL ?? "";
}

/** 설치된 앱을 초대 코드와 함께 여는 딥링크(`igjjeo://invite?code=<코드>`). */
export function buildAppOpenUrl(code: string): string {
  return `${APP_URL_SCHEME}://invite?code=${code}`;
}
