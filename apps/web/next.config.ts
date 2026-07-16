import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 모노레포 루트(bun.lock 위치)를 명시해 워크스페이스 루트 추론 경고를 없앤다
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
