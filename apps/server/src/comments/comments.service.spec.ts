import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";

import type { CommentRow, CommentsRepository } from "./comments.repository";
import { CommentsService } from "./comments.service";

function commentRow(id: string, at: string): CommentRow {
  return { id, masked_name: "이*아", body: "댓글", created_at: at };
}

function makeService() {
  const comments = {
    list: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockResolvedValue(commentRow("c1", "2026-07-17T00:00:00.000Z")),
    getOwner: jest
      .fn()
      .mockResolvedValue({ id: "c1", user_id: "u1", article_id: "a1" }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CommentsRepository>;
  const queryBus = {
    execute: jest.fn().mockResolvedValue({ id: "a1", group_id: "g1" }),
  } as unknown as jest.Mocked<QueryBus>;
  return { service: new CommentsService(comments, queryBus), comments, queryBus };
}

describe("CommentsService", () => {
  describe("list", () => {
    it("작성자를 author.masked_name 으로 감싸 반환한다", async () => {
      const { service, comments } = makeService();
      (comments.list as jest.Mock).mockResolvedValue([
        commentRow("c1", "2026-07-17T00:00:00.000Z"),
      ]);

      const result = await service.list("u1", "a1", {});

      expect(result.items[0]).toEqual({
        id: "c1",
        author: { masked_name: "이*아" },
        body: "댓글",
        created_at: "2026-07-17T00:00:00.000Z",
      });
      expect(result.next_cursor).toBeNull();
    });

    it("limit+1 건이면 next_cursor 를 발급한다", async () => {
      const { service, comments } = makeService();
      const rows = Array.from({ length: 21 }, (_, i) =>
        commentRow(`c${i}`, `2026-07-17T00:00:${String(i).padStart(2, "0")}.000Z`),
      );
      (comments.list as jest.Mock).mockResolvedValue(rows);

      const result = await service.list("u1", "a1", {});

      expect(result.items).toHaveLength(20);
      expect(result.next_cursor).not.toBeNull();
    });
  });

  describe("create", () => {
    it("댓글을 작성하고 응답을 반환한다", async () => {
      const { service, comments, queryBus } = makeService();

      const result = await service.create("u1", "a1", "댓글");

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetArticleAccessQuery("u1", "a1"),
      );
      expect(comments.create).toHaveBeenCalledWith("a1", "u1", "댓글");
      expect(result.author.masked_name).toBe("이*아");
    });
  });

  describe("delete", () => {
    it("없는 댓글이면 404", async () => {
      const { service, comments } = makeService();
      (comments.getOwner as jest.Mock).mockResolvedValue(null);

      await expect(service.delete("u1", "c1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("타인 댓글이면 403", async () => {
      const { service, comments } = makeService();
      (comments.getOwner as jest.Mock).mockResolvedValue({
        id: "c1",
        user_id: "other",
        article_id: "a1",
      });

      await expect(service.delete("u1", "c1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("본인 댓글이면 삭제한다", async () => {
      const { service, comments } = makeService();

      await service.delete("u1", "c1");

      expect(comments.delete).toHaveBeenCalledWith("c1");
    });
  });
});
