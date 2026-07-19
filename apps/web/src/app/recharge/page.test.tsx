import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const back = vi.fn();
const refillMutate = vi.fn();
let refillPending = false;

vi.mock("@/hooks/common/useStackBack", () => ({
  useStackBack: () => back,
}));

vi.mock(
  "@/hooks/features/query/mutations/useRefillReportQuotaMutation",
  () => ({
    useRefillReportQuotaMutation: () => ({
      mutate: refillMutate,
      isPending: refillPending,
    }),
  }),
);

import RechargePage from "./page";

describe("RechargePage", () => {
  beforeEach(() => {
    back.mockClear();
    refillMutate.mockClear();
    refillPending = false;
  });

  it("충전 방법 목록의 최상단에 프로토타입 테스트용 충전을 노출한다", () => {
    render(<RechargePage />);
    const items = screen.getAllByRole("listitem");
    expect(
      within(items[0]).getByText("프로토타입 테스트용 충전"),
    ).toBeInTheDocument();
  });

  it("광고·인앱결제 등 이후 충전 방법도 함께 보여준다", () => {
    render(<RechargePage />);
    expect(screen.getByText("광고 보고 충전")).toBeInTheDocument();
    expect(screen.getByText("인앱결제")).toBeInTheDocument();
  });

  it("테스트용 충전만 실행 가능하고 나머지는 준비 중이라 비활성이다", () => {
    render(<RechargePage />);
    const testMethod = screen.getByRole("button", {
      name: /프로토타입 테스트용 충전/,
    });
    expect(testMethod).toBeEnabled();
    expect(screen.getAllByText("준비 중")).toHaveLength(2);
  });

  it("테스트용 충전을 누르면 한도를 채우고 충전 화면을 닫는다", async () => {
    refillMutate.mockImplementation((_vars, options) => options?.onSuccess?.());
    render(<RechargePage />);

    await userEvent.click(
      screen.getByRole("button", { name: /프로토타입 테스트용 충전/ }),
    );

    expect(refillMutate).toHaveBeenCalledTimes(1);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("충전 중에는 테스트용 충전 버튼을 비활성화한다", () => {
    refillPending = true;
    render(<RechargePage />);
    expect(
      screen.getByRole("button", { name: /프로토타입 테스트용 충전/ }),
    ).toBeDisabled();
  });
});
