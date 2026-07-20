import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/common/shared/ui/Toast";
import { NATIVE_SHELL_UA_TOKEN } from "@/hooks/common/useIsNativeShell";
import { pendingInviteStore } from "@/lib/session/pendingInviteStore";
import { InviteGate } from ".";

const BROWSER_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";

function setLocation(search: string) {
  window.history.replaceState(null, "", `/group${search}`);
}

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

function renderGate() {
  return render(
    <InviteGate>
      <div data-testid="app">앱 내용</div>
    </InviteGate>,
    { wrapper: ToastProvider },
  );
}

beforeEach(() => {
  localStorage.clear();
  pendingInviteStore.reset();
});

afterEach(() => {
  setLocation("");
});

describe("InviteGate", () => {
  it("초대 파라미터가 없으면 자식을 그대로 렌더한다", () => {
    setUserAgent(BROWSER_UA);
    setLocation("");
    renderGate();
    expect(screen.getByTestId("app")).toBeVisible();
  });

  it("브라우저에서 초대 링크로 들어오면 설치 안내를 보여 준다", () => {
    setUserAgent(BROWSER_UA);
    setLocation("?invite=B3QFNS");
    renderGate();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
    expect(screen.getByText("B3QFNS")).toBeVisible();
    expect(screen.getByText("뉴스룸 초대장")).toBeVisible();
  });

  it("경로형 링크(?code=)도 초대 코드로 인식한다", () => {
    setUserAgent(BROWSER_UA);
    window.history.replaceState(null, "", "/invite?code=B3QFNS");
    renderGate();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
    expect(screen.getByText("B3QFNS")).toBeVisible();
  });

  it("앱(네이티브 셸)에서는 코드를 보관·URL 정리 후 자식을 통과시킨다", () => {
    setUserAgent(`${BROWSER_UA} ${NATIVE_SHELL_UA_TOKEN}`);
    setLocation("?invite=B3QFNS");
    renderGate();
    expect(screen.getByTestId("app")).toBeVisible();
    expect(pendingInviteStore.get()).toBe("B3QFNS");
    expect(window.location.search).not.toContain("invite");
  });
});
