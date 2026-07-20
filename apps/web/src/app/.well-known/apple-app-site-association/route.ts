/**
 * Apple App Site Association (AASA) — iOS Universal Links 검증 파일.
 *
 * `https://igjjeo-web.vercel.app/.well-known/apple-app-site-association` 로 서빙된다.
 * iOS는 앱 설치 시 이 파일을 받아, 여기 등록된 경로의 링크를 (브라우저 대신) 앱으로 연다.
 * 확장자 없는 경로 + `application/json` Content-Type 이어야 해서 정적 파일 대신 라우트 핸들러로 낸다.
 *
 * appID = `<AppleTeamId>.<bundleIdentifier>` (apps/mobile/app.json 기준).
 * 초대 링크만 앱으로 넘기고(웹 경험을 통째로 가로채지 않게) 범위를 좁힌다:
 *  - `/` + `?invite=…`  (공유되는 초대 링크)
 *  - `/invite…`          (앱 내부 초대 라우트)
 */

const APP_ID = "3XD9F9256D.com.geongyu09.igjjeo";

const AASA = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: [
          {
            "/": "/",
            "?": { invite: "?*" },
            comment: "초대 링크(/?invite=코드)를 앱으로 연다",
          },
          {
            "/": "/invite*",
            comment: "앱 내부 초대 라우트",
          },
        ],
      },
    ],
  },
};

export function GET() {
  return new Response(JSON.stringify(AASA), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
    },
  });
}
