import { AdaptContentCommand, AdaptContentHandler } from "./adapt-content.command";
import type { AdaptationService } from "./adaptation.service";

describe("AdaptContentHandler", () => {
  it("AdaptationService.adapt 로 위임한다(옵션 포함)", async () => {
    const drafts = [
      { outlet_key: "daily" as const, headline: "H", body: "B", reporter_name: "R" },
    ];
    const adaptation = {
      adapt: jest.fn().mockResolvedValue(drafts),
    } as unknown as jest.Mocked<AdaptationService>;
    const handler = new AdaptContentHandler(adaptation);

    const result = await handler.execute(
      new AdaptContentCommand("g1", "원문", ["daily"], { isSelfReport: true }),
    );

    expect(adaptation.adapt).toHaveBeenCalledWith("g1", "원문", ["daily"], {
      isSelfReport: true,
    });
    expect(result).toEqual(drafts);
  });
});
