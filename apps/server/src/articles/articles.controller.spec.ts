import type { ArticlesService } from "./articles.service";

import { ArticlesController } from "./articles.controller";

function makeController() {
  const service = {
    getFeed: jest.fn(),
    getArticle: jest.fn(),
    listCorrections: jest.fn(),
  } as unknown as jest.Mocked<ArticlesService>;
  return { controller: new ArticlesController(service), service };
}

describe("ArticlesController", () => {
  it("feed 는 멤버십 groupId 와 페이지 쿼리로 피드를 조회한다", async () => {
    const { controller, service } = makeController();

    await controller.feed(
      { id: "u1" },
      { groupId: "g1", role: "member" },
      { limit: 10, cursor: "c" },
    );

    expect(service.getFeed).toHaveBeenCalledWith("u1", "g1", {
      limit: 10,
      cursor: "c",
    });
  });

  it("getOne 은 기사 상세를 조회한다", async () => {
    const { controller, service } = makeController();
    await controller.getOne({ id: "u1" }, "a1");
    expect(service.getArticle).toHaveBeenCalledWith("u1", "a1");
  });

  it("corrections 는 정정 연쇄를 조회한다", async () => {
    const { controller, service } = makeController();
    await controller.corrections({ id: "u1" }, "a1");
    expect(service.listCorrections).toHaveBeenCalledWith("u1", "a1");
  });
});
