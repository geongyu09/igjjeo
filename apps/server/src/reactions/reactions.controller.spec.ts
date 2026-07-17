import type { ReactionsService } from "./reactions.service";

import { ReactionsController } from "./reactions.controller";

function makeController() {
  const service = {
    add: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ReactionsService>;
  return { controller: new ReactionsController(service), service };
}

describe("ReactionsController", () => {
  it("add 는 요청자·기사·반응종류를 서비스로 넘긴다", async () => {
    const { controller, service } = makeController();
    await controller.add({ id: "u1" }, "a1", "really");
    expect(service.add).toHaveBeenCalledWith("u1", "a1", "really");
  });

  it("remove 는 요청자·기사·반응종류를 서비스로 넘긴다", async () => {
    const { controller, service } = makeController();
    await controller.remove({ id: "u1" }, "a1", "shock");
    expect(service.remove).toHaveBeenCalledWith("u1", "a1", "shock");
  });
});
