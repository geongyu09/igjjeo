import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustBar } from ".";

describe("TrustBar", () => {
  it("인정·진짜? 카운트를 보여준다", () => {
    render(<TrustBar admitCount={7} reallyCount={2} total={10} />);
    expect(screen.getByText("인정 7")).toBeInTheDocument();
    expect(screen.getByText("진짜? 2")).toBeInTheDocument();
  });

  it("total 기준으로 막대 너비를 계산한다", () => {
    const { container } = render(
      <TrustBar admitCount={7} reallyCount={2} total={10} />,
    );
    expect(
      container.querySelector<HTMLElement>('[data-part="admit"]')!.style.width,
    ).toBe("70%");
    expect(
      container.querySelector<HTMLElement>('[data-part="really"]')!.style.width,
    ).toBe("20%");
  });

  it("total이 없으면 두 카운트의 합을 기준으로 한다", () => {
    const { container } = render(<TrustBar admitCount={3} reallyCount={1} />);
    expect(
      container.querySelector<HTMLElement>('[data-part="admit"]')!.style.width,
    ).toBe("75%");
    expect(
      container.querySelector<HTMLElement>('[data-part="really"]')!.style.width,
    ).toBe("25%");
  });

  it("인정이 우세하면 사실로 굳는 중이라고 판정한다", () => {
    render(<TrustBar admitCount={7} reallyCount={2} />);
    expect(screen.getByText("인정 우세 · 사실로 굳는 중")).toBeInTheDocument();
  });

  it("진짜?가 우세하면 정정 신호로 판정한다", () => {
    render(<TrustBar admitCount={1} reallyCount={5} />);
    expect(screen.getByText("진짜? 우세 · 정정 신호")).toBeInTheDocument();
  });

  it("동률이면 팽팽한 대치로 판정한다", () => {
    render(<TrustBar admitCount={3} reallyCount={3} />);
    expect(screen.getByText("팽팽한 대치")).toBeInTheDocument();
  });

  it("반응이 없으면 막대 너비는 0이다", () => {
    const { container } = render(<TrustBar admitCount={0} reallyCount={0} />);
    expect(
      container.querySelector<HTMLElement>('[data-part="admit"]')!.style.width,
    ).toBe("0%");
  });
});
