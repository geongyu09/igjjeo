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
    await userEvent.click(screen.getByRole("checkbox", { name: /데일리쇼크/ }));
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
    render(<PublisherCheckGroup value={["science"]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    expect(onChange).toHaveBeenCalledWith(["daily", "science"]);
  });

  it("max에 도달하면 아직 고르지 않은 언론사는 비활성이다", () => {
    render(
      <PublisherCheckGroup
        value={["daily", "shock", "science"]}
        max={3}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox", { name: /주간감성/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /소모임일보/ })).toBeEnabled();
  });

  it("max에 도달한 뒤 새 언론사를 눌러도 onChange를 호출하지 않는다", async () => {
    const onChange = vi.fn();
    render(
      <PublisherCheckGroup
        value={["daily", "shock", "science"]}
        max={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /주간감성/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("max에 도달해도 이미 고른 언론사는 해제할 수 있다", async () => {
    const onChange = vi.fn();
    render(
      <PublisherCheckGroup
        value={["daily", "shock", "science"]}
        max={3}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /소모임일보/ }));
    expect(onChange).toHaveBeenCalledWith(["shock", "science"]);
  });

  it("max를 주지 않으면 개수 제한 없이 고를 수 있다", async () => {
    const onChange = vi.fn();
    render(
      <PublisherCheckGroup
        value={["daily", "shock", "science"]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /주간감성/ }));
    expect(onChange).toHaveBeenCalledWith([
      "daily",
      "shock",
      "science",
      "emotion",
    ]);
  });
});
