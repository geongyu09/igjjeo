import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { QueryBus } from "@nestjs/cqrs";

import { GetArticleAccessQuery } from "@/articles/cqrs/get-article-access.query";

import type { ReactionsRepository } from "./reactions.repository";
import { ReactionsService } from "./reactions.service";

const state = {
  article_id: "a1",
  reaction_counts: { really: 1, shock: 0, admit: 0, scoop: 0 },
  my_reactions: ["really"],
};

function makeService() {
  const reactions = {
    add: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockResolvedValue(state),
  } as unknown as jest.Mocked<ReactionsRepository>;
  const queryBus = {
    execute: jest.fn().mockResolvedValue({ id: "a1", group_id: "g1" }),
  } as unknown as jest.Mocked<QueryBus>;
  return { service: new ReactionsService(reactions, queryBus), reactions, queryBus };
}

describe("ReactionsService", () => {
  it("add 는 멤버십 검사 후 반응을 누르고 갱신된 집계를 반환한다", async () => {
    const { service, reactions, queryBus } = makeService();

    const result = await service.add("u1", "a1", "really");

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetArticleAccessQuery("u1", "a1"),
    );
    expect(reactions.add).toHaveBeenCalledWith("a1", "u1", "really");
    expect(result).toEqual(state);
  });

  it("remove 는 반응을 취소하고 갱신된 집계를 반환한다", async () => {
    const { service, reactions } = makeService();

    await service.remove("u1", "a1", "shock");

    expect(reactions.remove).toHaveBeenCalledWith("a1", "u1", "shock");
  });

  it("지원하지 않는 반응 종류면 400", async () => {
    const { service } = makeService();
    await expect(service.add("u1", "a1", "love")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("비멤버면 404(접근 쿼리가 던짐)", async () => {
    const { service, queryBus } = makeService();
    (queryBus.execute as jest.Mock).mockRejectedValue(new NotFoundException());

    await expect(service.add("u1", "a1", "really")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
