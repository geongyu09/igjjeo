import { Test } from "@nestjs/testing";

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it("서비스가 살아있으면 status ok 를 반환한다", () => {
    const result = controller.check();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("igjjeo-api");
  });
});
