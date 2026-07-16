import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LockScreenPage from "./page";

describe("LockScreenPage", () => {
  it("날짜와 속보 알림을 렌더링한다", () => {
    render(<LockScreenPage />);
    expect(screen.getByText("7월 15일 화요일")).toBeInTheDocument();
    expect(screen.getByText("【속보】 상습 지각, 이대로 괜찮은가")).toBeInTheDocument();
  });
});
