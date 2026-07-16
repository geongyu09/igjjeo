import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("switch 역할과 checked 상태를 노출한다", () => {
    render(<Toggle checked onChange={() => {}} aria-label="데일리쇼크 구독" />);
    const toggle = screen.getByRole("switch", { name: "데일리쇼크 구독" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("꺼진 상태는 aria-checked=false다", () => {
    render(<Toggle checked={false} onChange={() => {}} aria-label="구독" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("클릭하면 반전된 값으로 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} aria-label="구독" />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("켜진 상태에서 클릭하면 false로 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} aria-label="구독" />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
