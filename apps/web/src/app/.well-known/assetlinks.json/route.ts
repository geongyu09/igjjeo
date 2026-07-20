/**
 * Digital Asset Links — Android App Links 검증 파일.
 *
 * `https://igjjeo-web.vercel.app/.well-known/assetlinks.json` 로 서빙된다.
 * `app.json`의 intentFilter(autoVerify)가 이 파일로 도메인 소유를 검증해야, 초대 링크를
 * 브라우저 대신 앱으로 연다.
 *
 * ⚠ sha256_cert_fingerprints 는 APK 서명 인증서의 지문이어야 한다. 서버 환경변수
 *   `ANDROID_CERT_SHA256`(콜론 구분 16진, 여러 개면 쉼표로 나열)로 주입한다. 미설정 시
 *   플레이스홀더가 나가며, 실제 지문을 넣기 전까지 App Links 검증은 통과하지 못한다.
 *   지문 확인: keytool -list -v -keystore <keystore> | grep SHA256  (또는 build-android-apk.sh 산출물)
 */

const PACKAGE_NAME = "com.geongyu09.igjjeo";
const PLACEHOLDER_FINGERPRINT = "REPLACE_WITH_APK_SIGNING_CERT_SHA256";

function fingerprints(): string[] {
  const raw = process.env.ANDROID_CERT_SHA256;
  if (!raw) return [PLACEHOLDER_FINGERPRINT];
  const list = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return list.length > 0 ? list : [PLACEHOLDER_FINGERPRINT];
}

export function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints(),
      },
    },
  ];
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
    },
  });
}
