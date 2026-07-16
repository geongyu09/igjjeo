import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CorrectionThread } from ".";

const ITEMS = [
  {
    outlet: "shock",
    kind: "original",
    headline: "【단독】 상습 지각, 이대로 괜찮은가",
    meta: "원본 · 👀 12",
  },
  {
    outlet: "daily",
    kind: "correction",
    headline: "본지는 앞선 보도를 정정합니다",
    body: "김*규 씨는 지각한 것이 아니라, 애초에 참석하지 않은 것으로 확인됐다.",
    meta: "제3자 정정 · 👀 21",
  },
  {
    outlet: "shock",
    kind: "recorrection",
    headline: '【충격】 "안 왔다"는 주장마저 거짓이었나',
    meta: "제3자 정정 · 👀 34",
  },
] as const;

describe("CorrectionThread", () => {
  it("모든 노드의 헤드라인을 순서대로 렌더링한다", () => {
    render(<CorrectionThread items={[...ITEMS]} />);
    const nodes = screen.getAllByRole("listitem");
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toHaveTextContent("상습 지각");
    expect(nodes[2]).toHaveTextContent("거짓이었나");
  });

  it("정정 노드에는 정정 배지가 붙는다", () => {
    render(<CorrectionThread items={[...ITEMS]} />);
    expect(screen.getByText("정정")).toBeInTheDocument();
    expect(screen.getByText("재정정")).toBeInTheDocument();
  });

  it("본문과 메타 정보를 렌더링한다", () => {
    render(<CorrectionThread items={[...ITEMS]} />);
    expect(screen.getByText(/애초에 참석하지 않은 것으로/)).toBeInTheDocument();
    expect(screen.getByText("제3자 정정 · 👀 21")).toBeInTheDocument();
  });
});
