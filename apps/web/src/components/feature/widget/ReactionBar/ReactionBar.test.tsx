import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReactionBar } from ".";

const COUNTS = { really: 2, shock: 5, admit: 7, scoop: 3 };

describe("ReactionBar", () => {
  it("반응 4종을 카운트와 함께 렌더링한다", () => {
    render(<ReactionBar counts={COUNTS} />);
    expect(
      screen.getByRole("button", { name: /진짜\? 2/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /충격 5/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /인정 7/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /특종 3/ })).toBeInTheDocument();
  });

  it("내가 누른 반응만 aria-pressed=true다", () => {
    render(<ReactionBar counts={COUNTS} myReaction="admit" />);
    expect(screen.getByRole("button", { name: /인정/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /충격/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("반응을 누르면 해당 타입으로 onReact가 호출된다", async () => {
    const onReact = vi.fn();
    render(<ReactionBar counts={COUNTS} onReact={onReact} />);
    await userEvent.click(screen.getByRole("button", { name: /특종/ }));
    expect(onReact).toHaveBeenCalledWith("scoop");
  });
});
