import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("children을 렌더링한다", () => {
    render(<Badge>속보</Badge>);
    expect(screen.getByText("속보")).toBeInTheDocument();
  });

  it("기본 variant는 neutral이다", () => {
    render(<Badge>단독</Badge>);
    expect(screen.getByText("단독")).toHaveAttribute("data-variant", "neutral");
  });

  it("variant를 data 속성으로 노출한다", () => {
    render(<Badge variant="accent-strong">정정</Badge>);
    expect(screen.getByText("정정")).toHaveAttribute("data-variant", "accent-strong");
  });

  it("success variant를 지원한다", () => {
    render(<Badge variant="success">사실로 굳음</Badge>);
    expect(screen.getByText("사실로 굳음")).toHaveAttribute("data-variant", "success");
  });
});
