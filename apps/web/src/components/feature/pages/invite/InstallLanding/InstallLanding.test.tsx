import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/common/shared/ui/Toast";
import { InstallLanding } from ".";

const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    value: 5,
    configurable: true,
  });
}

function renderLanding(code = "B3QFNS") {
  return render(<InstallLanding code={code} />, { wrapper: ToastProvider });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_ANDROID_APK_URL", "https://dl.example.com/app.apk");
  vi.stubEnv(
    "NEXT_PUBLIC_IOS_TESTFLIGHT_URL",
    "https://testflight.apple.com/join/abc",
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("InstallLanding", () => {
  it("초대 코드를 보여 준다", () => {
    setUserAgent(ANDROID_UA);
    renderLanding("B3QFNS");
    expect(screen.getByText("B3QFNS")).toBeVisible();
  });

  it("Android에서는 APK 다운로드 링크를 제시한다", () => {
    setUserAgent(ANDROID_UA);
    renderLanding();
    const link = screen.getByRole("link", { name: /APK/ });
    expect(link).toHaveAttribute("href", "https://dl.example.com/app.apk");
  });

  it("iOS에서는 TestFlight 링크를 제시한다", () => {
    setUserAgent(IOS_UA);
    renderLanding();
    const link = screen.getByRole("link", { name: /TestFlight로 설치하기/ });
    expect(link).toHaveAttribute(
      "href",
      "https://testflight.apple.com/join/abc",
    );
  });

  it("앱에서 열기 링크는 커스텀 스킴 딥링크를 가리킨다", () => {
    setUserAgent(ANDROID_UA);
    renderLanding("B3QFNS");
    const link = screen.getByRole("link", { name: /앱에서 열기/ });
    expect(link).toHaveAttribute("href", "igjjeo://invite?code=B3QFNS");
  });

  it("코드 복사 버튼은 초대 코드를 클립보드에 복사한다", async () => {
    setUserAgent(ANDROID_UA);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderLanding("B3QFNS");
    await userEvent.click(screen.getByRole("button", { name: /코드 복사/ }));
    expect(writeText).toHaveBeenCalledWith("B3QFNS");
    expect(await screen.findByText("초대 코드를 복사했어요")).toBeVisible();
  });
});
