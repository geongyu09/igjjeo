import type { CommentsService } from "./comments.service";

import { CommentsController } from "./comments.controller";

function makeController() {
  const service = {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CommentsService>;
  return { controller: new CommentsController(service), service };
}

describe("CommentsController", () => {
  it("list 는 페이지 쿼리로 댓글을 조회한다", async () => {
    const { controller, service } = makeController();
    await controller.list({ id: "u1" }, "a1", { limit: 10, cursor: "c" });
    expect(service.list).toHaveBeenCalledWith("u1", "a1", {
      limit: 10,
      cursor: "c",
    });
  });

  it("create 는 body 로 댓글을 작성한다", async () => {
    const { controller, service } = makeController();
    await controller.create({ id: "u1" }, "a1", { body: "댓글" });
    expect(service.create).toHaveBeenCalledWith("u1", "a1", "댓글");
  });

  it("remove 는 댓글을 삭제한다", async () => {
    const { controller, service } = makeController();
    await controller.remove({ id: "u1" }, "c1");
    expect(service.delete).toHaveBeenCalledWith("u1", "c1");
  });
});
