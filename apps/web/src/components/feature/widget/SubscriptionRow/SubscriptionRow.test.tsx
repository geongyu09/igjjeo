import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SubscriptionRow } from ".";

describe("SubscriptionRow", () => {
  it("언론사 이름과 성격을 렌더링한다", () => {
    render(<SubscriptionRow outlet="shock" subscribed onChange={() => {}} />);
    expect(screen.getByText("데일리쇼크")).toBeInTheDocument();
  });

  it("구독 상태를 switch의 aria-checked로 노출한다", () => {
    render(
      <SubscriptionRow outlet="daily" subscribed={false} onChange={() => {}} />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("토글하면 반전된 값으로 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    render(<SubscriptionRow outlet="emotion" subscribed onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
