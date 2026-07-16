import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("title을 렌더링한다", () => {
    render(<EmptyState title="아직 발행된 기사가 없어요" />);
    expect(screen.getByText("아직 발행된 기사가 없어요")).toBeInTheDocument();
  });

  it("description을 렌더링한다", () => {
    render(<EmptyState title="비어 있음" description="첫 제보를 올리면 여기에 기사가 실려요" />);
    expect(screen.getByText("첫 제보를 올리면 여기에 기사가 실려요")).toBeInTheDocument();
  });

  it("action을 렌더링한다", () => {
    render(<EmptyState title="비어 있음" action={<button>첫 제보하기</button>} />);
    expect(screen.getByRole("button", { name: "첫 제보하기" })).toBeInTheDocument();
  });
});
