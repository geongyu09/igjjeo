import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommentThread } from ".";

const comments = [
  {
    id: "c1",
    authorLabel: "이*아",
    timeLabel: "방금",
    body: "데일리쇼크 왜 이래 ㅋㅋㅋ",
  },
  {
    id: "c2",
    authorLabel: "박*호",
    timeLabel: "2분",
    body: "이건 좀 과장인데 ㅋㅋ",
  },
];

describe("CommentThread", () => {
  it("각 댓글의 작성자·본문·시각을 렌더링한다", () => {
    render(<CommentThread comments={comments} />);
    expect(screen.getByText("데일리쇼크 왜 이래 ㅋㅋㅋ")).toBeInTheDocument();
    expect(screen.getByText("이건 좀 과장인데 ㅋㅋ")).toBeInTheDocument();
    expect(screen.getByText("박*호")).toBeInTheDocument();
    expect(screen.getByText(/방금/)).toBeInTheDocument();
  });

  it("댓글이 없으면 안내 문구를 보여준다", () => {
    render(<CommentThread comments={[]} />);
    expect(screen.getByText(/첫 댓글/)).toBeInTheDocument();
  });
});
