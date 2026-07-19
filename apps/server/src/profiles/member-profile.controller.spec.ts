import type { ProfilesService } from "./profiles.service";

import { MemberProfileController } from "./member-profile.controller";

function makeController() {
  const service = {
    getMemberProfileSummary: jest.fn(),
  } as unknown as jest.Mocked<ProfilesService>;
  return { controller: new MemberProfileController(service), service };
}

describe("MemberProfileController", () => {
  it("GET /groups/:groupId/me/profile 은 요청자 id·멤버십 방으로 요약을 조회한다", async () => {
    const { controller, service } = makeController();
    const summary = {
      stats: { reports: 0, reactions: 0, scoops: 0 },
      reports: [],
    };
    (service.getMemberProfileSummary as jest.Mock).mockResolvedValue(summary);

    const result = await controller.getProfileSummary(
      { id: "user-1" },
      { groupId: "g1", role: "member" },
    );

    expect(service.getMemberProfileSummary).toHaveBeenCalledWith(
      "user-1",
      "g1",
    );
    expect(result).toBe(summary);
  });
});
