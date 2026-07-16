import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("이름의 첫 글자를 보여준다", () => {
    render(<Avatar name="김민규" />);
    expect(screen.getByText("김")).toBeInTheDocument();
  });

  it("기본 size는 md다", () => {
    render(<Avatar name="이서아" />);
    expect(screen.getByText("이").closest("[data-size]")).toHaveAttribute("data-size", "md");
  });

  it("size를 data 속성으로 노출한다", () => {
    render(<Avatar name="박준호" size="lg" />);
    expect(screen.getByText("박").closest("[data-size]")).toHaveAttribute("data-size", "lg");
  });

  it("emphasized면 강조 스타일 속성을 가진다", () => {
    render(<Avatar name="박준호" emphasized />);
    expect(screen.getByText("박").closest("[data-size]")).toHaveAttribute("data-emphasized");
  });

  it("이름이 없으면 플레이스홀더 아이콘을 보여준다", () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("[data-placeholder]")).toBeInTheDocument();
  });
});
