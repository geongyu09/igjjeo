import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 실기기 WebView는 dev 서버를 localhost가 아닌 개발 머신 LAN IP로 접근한다
  // (apps/mobile의 EXPO_PUBLIC_WEB_URL). Next 16 dev는 교차 출처에서 오는 /_next
  // 내부 리소스·HMR 웹소켓을 기본 차단하는데, 이게 막히면 클라이언트 런타임이
  // 완성되지 못해 하이드레이션이 끊기고 브리지(useBridge)가 SYN을 못 보낸다.
  // LAN 서브넷을 허용해 실기기에서 정상 하이드레이션되게 한다. IP 대역이 바뀌면 갱신.
  allowedDevOrigins: ["172.30.1.*"],
  // 모노레포 루트(bun.lock 위치)를 명시해 워크스페이스 루트 추론 경고를 없앤다
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
