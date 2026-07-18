import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PublisherCheckGroup } from ".";

describe("PublisherCheckGroup", () => {
  it("기본으로 언론사 5곳을 checkbox로 렌더링한다", () => {
    render(<PublisherCheckGroup value={[]} onChange={() => {}} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(
      screen.getByRole("checkbox", { name: /소모임일보/ }),
    ).toBeInTheDocument();
  });

  it("선택된 언론사만 aria-checked=true다", () => {
    render(<PublisherCheckGroup value={["shock"]} onChange={() => {}} />);
    expect(
      screen.getByRole("checkbox", { name: /데일리쇼크/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("checkbox", { name: /소모임일보/ }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("선택되지 않은 항목을 누르면 추가된 목록으로 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(<PublisherCheckGroup value={["daily"]} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: /데일리쇼크/ }),
    );
    expect(onChange).toHaveBeenCalledWith(["daily", "shock"]);
  });

  it("이미 선택된 항목을 누르면 제거된 목록으로 onChange가 호출된다", async () => {
    const onChange = vi.fn();
    render(
      <PublisherCheckGroup value={["daily", "shock"]} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    expect(onChange).toHaveBeenCalledWith(["shock"]);
  });

  it("반환하는 목록은 언론사 표시 순서를 유지한다", async () => {
    const onChange = vi.fn();
    render(<PublisherCheckGroup value={["economy"]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    expect(onChange).toHaveBeenCalledWith(["daily", "economy"]);
  });
});
