import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignedOutletList } from ".";

describe("AssignedOutletList", () => {
  it("후보 언론사 5곳을 모두 렌더링한다", () => {
    render(<AssignedOutletList assigned={["shock", "science", "emotion"]} />);
    for (const name of [
      "데일리쇼크",
      "모임과학",
      "주간감성",
      "소모임일보",
      "스터디경제",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("배정된 언론사 수만큼 '배정됨' 표시를 보여준다", () => {
    render(<AssignedOutletList assigned={["shock", "science", "emotion"]} />);
    expect(screen.getAllByText("배정됨")).toHaveLength(3);
  });

  it("배정된 행은 data-assigned를 노출한다", () => {
    const { container } = render(<AssignedOutletList assigned={["shock"]} />);
    expect(container.querySelectorAll("[data-assigned]")).toHaveLength(1);
  });
});
