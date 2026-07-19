import type { GroupsRepository } from "../groups.repository";
import {
  FindGroupKeywordHandler,
  FindGroupKeywordQuery,
} from "./find-group-keyword.query";

describe("FindGroupKeywordHandler", () => {
  it("GroupsRepository.getKeyword 로 위임한다", async () => {
    const groups = {
      getKeyword: jest.fn().mockResolvedValue("지각 대장들"),
    } as unknown as jest.Mocked<GroupsRepository>;
    const handler = new FindGroupKeywordHandler(groups);

    const result = await handler.execute(new FindGroupKeywordQuery("g1"));

    expect(groups.getKeyword).toHaveBeenCalledWith("g1");
    expect(result).toBe("지각 대장들");
  });
});
