import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("stack-link", () => ({
  StackLinkProvider: ({ children }: { children: ReactNode }) => children,
}));

import { viewport } from "./layout";

describe("RootLayout viewport", () => {
  it("핀치 줌 확대를 막기 위해 사용자 스케일을 비활성화한다", () => {
    expect(viewport.maximumScale).toBe(1);
    expect(viewport.userScalable).toBe(false);
  });

  it("모바일 뷰포트 기본값(device-width, initial-scale 1)을 유지한다", () => {
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });
});
