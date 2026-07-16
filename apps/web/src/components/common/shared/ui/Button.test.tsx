import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("children을 렌더링한다", () => {
    render(<Button>기사 만들기</Button>);
    expect(screen.getByRole("button", { name: "기사 만들기" })).toBeInTheDocument();
  });

  it("기본값은 primary variant, md size다", () => {
    render(<Button>버튼</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("variant와 size를 data 속성으로 노출한다", () => {
    render(
      <Button variant="accent" size="lg">
        정정 요청
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "accent");
    expect(button).toHaveAttribute("data-size", "lg");
  });

  it("클릭하면 onClick이 호출된다", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>버튼</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disabled면 클릭해도 onClick이 호출되지 않는다", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        버튼
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("iconOnly 버튼은 접근 가능한 이름을 aria-label로 가진다", () => {
    render(<Button iconOnly aria-label="더보기" />);
    expect(screen.getByRole("button", { name: "더보기" })).toHaveAttribute("data-icon-only");
  });
});
