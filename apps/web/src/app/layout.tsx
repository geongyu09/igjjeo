import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { StackLinkProvider } from "stack-link";
import { NativeBackListener } from "@/components/common/shared/NativeBackListener";
import { QueryBoundary } from "@/components/common/shared/QueryBoundary";
import { QueryProvider } from "@/components/common/shared/QueryProvider";
import { SessionProvider } from "@/components/common/shared/SessionProvider";
import { ToastProvider } from "@/components/common/shared/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "이거 진짜에요?",
  description:
    "소모임 안의 사소한 일을 AI가 언론사 시각으로 각색해 방 안에만 발행하는 뉴스",
};

// 웹뷰 셸에서 앱처럼 동작하도록 핀치 줌/더블탭 확대를 차단한다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// bootstrap.js — RemoteDevTools 포트리스 · 호스트리스 부트스트랩 로더 (템플릿)
//
// 이 파일은 서버가 GET /bootstrap.js 로 내려줄 때 아래 호스트 플레이스홀더를 실제
// 후보 목록으로 치환한다. 앱의 "📋 주입 스크립트 복사" 버튼이 그 결과를
// <script>…</script> 인라인 형태로 클립보드에 넣어주므로, 사용자는 포트도 IP도
// 직접 적을 필요가 없다.
//
// 서버 주소를 찾는 순서:
//   1) location.hostname — 페이지가 개발 머신에서 서빙 중이면 이게 정답일 확률이 가장 높다
//   2) 서버가 주입한 후보 — localhost(iOS 시뮬) / 10.0.2.2(안드 에뮬) / LAN IP(실기기)
// 각 호스트에 대해 알려진 포트 범위를 훑고, GET /json/version 의 신원값으로 확인한다.
// 찾으면 그 origin 에서 devtools-client.js 를 주입하고, 이후는 클라이언트가 자기 src 의
// origin 으로 WebSocket 주소를 스스로 유도한다.
//
// ⚠ RANGE_START / RANGE_COUNT 는 server.js 의 값과 반드시 일치해야 한다.
const REMOTE_DEVTOOLS_BOOTSTRAP = `
(function () {
  "use strict";
  if (window.__REMOTE_DEVTOOLS_BOOTSTRAP__) return; // 중복 주입 방지
  window.__REMOTE_DEVTOOLS_BOOTSTRAP__ = true;

  var INJECTED_HOSTS = ["localhost","127.0.0.1","10.0.2.2","172.30.1.33"]; // 서버가 치환 (예: ["localhost","10.0.2.2","192.168.0.42"])
  var RANGE_START = 3002;
  var RANGE_COUNT = 30;
  var TIMEOUT_MS = 400;
  var IDENTITY = "RemoteDevTools/1.0"; // /json/version 의 Browser 필드

  // 페이지 자신의 호스트를 최우선 후보로 (개발 머신에서 서빙되는 경우 바로 적중)
  var HOSTS = [];
  try {
    if (location.hostname) HOSTS.push(location.hostname);
  } catch (e) {}
  for (var h = 0; h < INJECTED_HOSTS.length; h++) {
    if (HOSTS.indexOf(INJECTED_HOSTS[h]) === -1) HOSTS.push(INJECTED_HOSTS[h]);
  }

  function probe(host, port) {
    return new Promise(function (resolve, reject) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () {
        ctrl.abort();
        reject();
      }, TIMEOUT_MS);
      fetch("http://" + host + ":" + port + "/json/version", { signal: ctrl.signal })
        .then(function (r) {
          return r.json();
        })
        .then(function (v) {
          clearTimeout(timer);
          if (v && v.Browser === IDENTITY) resolve({ host: host, port: port });
          else reject();
        })
        .catch(function () {
          clearTimeout(timer);
          reject();
        });
    });
  }

  // 후보쌍들을 동시에 던져 가장 먼저 응답한 서버를 채택 (없으면 null)
  function firstMatch(pairs) {
    return new Promise(function (resolve) {
      var pending = pairs.length;
      if (!pending) return resolve(null);
      var done = false;
      pairs.forEach(function (p) {
        probe(p[0], p[1])
          .then(function (hit) {
            if (done) return;
            done = true;
            resolve(hit);
          })
          .catch(function () {})
          .finally(function () {
            if (--pending === 0 && !done) resolve(null);
          });
      });
    });
  }

  // 서버는 보통 범위의 첫 포트를 잡으므로, 1차로 그것만 빠르게 훑고
  // 실패했을 때만 나머지 포트로 넓힌다 (흔한 경우의 지연을 최소화).
  var wave1 = HOSTS.map(function (host) {
    return [host, RANGE_START];
  });
  var wave2 = [];
  for (var i = 1; i < RANGE_COUNT; i++) {
    for (var j = 0; j < HOSTS.length; j++) wave2.push([HOSTS[j], RANGE_START + i]);
  }

  function inject(hit) {
    var s = document.createElement("script");
    s.src = "http://" + hit.host + ":" + hit.port + "/devtools-client.js";
    (document.head || document.documentElement).appendChild(s);
    console.log("[RemoteDevTools] 서버 발견 → 클라이언트 주입: " + hit.host + ":" + hit.port);
  }

  firstMatch(wave1)
    .then(function (hit) {
      return hit || firstMatch(wave2);
    })
    .then(function (hit) {
      if (hit) return inject(hit);
      console.warn(
        "[RemoteDevTools] 서버를 찾지 못했습니다.\\n" +
          "  시도한 호스트: " + HOSTS.join(", ") + "\\n" +
          "  포트 범위: " + RANGE_START + "~" + (RANGE_START + RANGE_COUNT - 1) + "\\n" +
          "  앱이 실행 중인지, 기기가 같은 네트워크에 있는지 확인하세요.",
      );
    });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>
        {/* RemoteDevTools 포트리스 부트스트랩 로더 (실기기 웹뷰 원격 디버깅용, 개발 환경 전용) */}
        {process.env.NODE_ENV === "development" && (
          <Script
            id="remote-devtools-bootstrap"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: REMOTE_DEVTOOLS_BOOTSTRAP }}
          />
        )}
        <QueryProvider>
          <StackLinkProvider>
            <NativeBackListener />
            <QueryBoundary>
              <ToastProvider>
                <SessionProvider>{children}</SessionProvider>
              </ToastProvider>
            </QueryBoundary>
          </StackLinkProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
