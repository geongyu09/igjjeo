import type { ProfilesService } from "./profiles.service";

import { MeController } from "./me.controller";

function makeController() {
  const service = {
    getMe: jest.fn(),
    updateMe: jest.fn(),
  } as unknown as jest.Mocked<ProfilesService>;
  return { controller: new MeController(service), service };
}

describe("MeController", () => {
  it("GET /me 는 요청자 id 로 프로필을 조회한다", async () => {
    const { controller, service } = makeController();
    const profile = { id: "user-1" } as never;
    (service.getMe as jest.Mock).mockResolvedValue(profile);

    const result = await controller.getMe({ id: "user-1" });

    expect(service.getMe).toHaveBeenCalledWith("user-1");
    expect(result).toBe(profile);
  });

  it("PATCH /me 는 요청자 id 와 부분 필드로 갱신한다", async () => {
    const { controller, service } = makeController();
    await controller.updateMe({ id: "user-1" }, { display_name: "박건규" });

    expect(service.updateMe).toHaveBeenCalledWith("user-1", {
      display_name: "박건규",
    });
  });
});
