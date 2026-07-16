import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PublisherRadioGroup } from "./PublisherRadioGroup";

describe("PublisherRadioGroup", () => {
  it("기본으로 MVP 세 언론사를 radio로 렌더링한다", () => {
    render(<PublisherRadioGroup value={null} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "소모임일보" })).toBeInTheDocument();
  });

  it("outlets로 노출할 언론사를 제한할 수 있다", () => {
    render(<PublisherRadioGroup outlets={["shock", "daily"]} value={null} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("선택된 언론사만 aria-checked=true다", () => {
    render(<PublisherRadioGroup value="shock" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "데일리쇼크" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "소모임일보" })).toHaveAttribute("aria-checked", "false");
  });

  it("클릭하면 해당 outlet으로 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(<PublisherRadioGroup value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "스터디경제" }));
    expect(onChange).toHaveBeenCalledWith("economy");
  });

  it("선택된 항목만 tab 순서에 들어가고, 선택이 없으면 첫 항목이 들어간다", () => {
    const { rerender } = render(<PublisherRadioGroup value="shock" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "데일리쇼크" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "소모임일보" })).toHaveAttribute("tabindex", "-1");
    rerender(<PublisherRadioGroup value={null} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "소모임일보" })).toHaveAttribute("tabindex", "0");
  });

  it("화살표 키로 다음 언론사를 선택한다", async () => {
    const onChange = vi.fn();
    render(<PublisherRadioGroup value="daily" onChange={onChange} />);
    screen.getByRole("radio", { name: "소모임일보" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalledWith("shock");
  });
});
