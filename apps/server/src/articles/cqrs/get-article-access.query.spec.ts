import type { ArticleAccessService } from "../article-access.service";
import {
  GetArticleAccessHandler,
  GetArticleAccessQuery,
} from "./get-article-access.query";

describe("GetArticleAccessHandler", () => {
  it("ArticleAccessService.assertMember 로 위임한다(requireActive 전달)", async () => {
    const access = {
      assertMember: jest.fn().mockResolvedValue({ id: "a1", group_id: "g1" }),
    } as unknown as jest.Mocked<ArticleAccessService>;
    const handler = new GetArticleAccessHandler(access);

    const result = await handler.execute(
      new GetArticleAccessQuery("u1", "a1", true),
    );

    expect(access.assertMember).toHaveBeenCalledWith("u1", "a1", {
      requireActive: true,
    });
    expect(result).toEqual({ id: "a1", group_id: "g1" });
  });
});
