import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = [
  { value: "pick", label: "내가 고르기" },
  { value: "random", label: "무작위 3곳" },
];

describe("SegmentedControl", () => {
  it("모든 옵션을 radio로 렌더링한다", () => {
    render(<SegmentedControl options={OPTIONS} value="pick" onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("현재 값만 aria-checked=true다", () => {
    render(<SegmentedControl options={OPTIONS} value="pick" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "내가 고르기" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "무작위 3곳" })).toHaveAttribute("aria-checked", "false");
  });

  it("옵션을 클릭하면 해당 값으로 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="pick" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "무작위 3곳" }));
    expect(onChange).toHaveBeenCalledWith("random");
  });

  it("선택된 옵션만 tab 순서에 들어간다 (roving tabindex)", () => {
    render(<SegmentedControl options={OPTIONS} value="pick" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "내가 고르기" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "무작위 3곳" })).toHaveAttribute("tabindex", "-1");
  });

  it("화살표 키로 다음 옵션을 선택한다", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="pick" onChange={onChange} />);
    screen.getByRole("radio", { name: "내가 고르기" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("random");
  });

  it("첫 옵션에서 왼쪽 화살표를 누르면 마지막 옵션으로 순환한다", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="pick" onChange={onChange} />);
    screen.getByRole("radio", { name: "내가 고르기" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith("random");
  });
});
