import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip } from ".";

describe("Chip", () => {
  it("children을 렌더링한다", () => {
    render(<Chip>김*규</Chip>);
    expect(screen.getByRole("button", { name: "김*규" })).toBeInTheDocument();
  });

  it("selected 상태를 aria-pressed로 노출한다", () => {
    render(<Chip selected>김*규</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("기본은 선택되지 않은 상태다", () => {
    render(<Chip>이*아</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("dashed 스타일을 지원한다", () => {
    render(<Chip dashed>직접</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("data-dashed");
  });

  it("클릭하면 onClick이 호출된다", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>박*호</Chip>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
