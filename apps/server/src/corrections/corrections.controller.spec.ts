import type { CorrectionsService } from "./corrections.service";

import { CorrectionsController } from "./corrections.controller";

function makeController() {
  const service = {
    requestDeletion: jest.fn(),
    requestCorrection: jest.fn(),
  } as unknown as jest.Mocked<CorrectionsService>;
  return { controller: new CorrectionsController(service), service };
}

describe("CorrectionsController", () => {
  it("requestDeletion 은 요청자·기사로 삭제를 요청한다", async () => {
    const { controller, service } = makeController();
    await controller.requestDeletion({ id: "u1" }, "a1");
    expect(service.requestDeletion).toHaveBeenCalledWith("u1", "a1");
  });

  it("requestCorrection 은 body 를 camelCase 로 변환해 넘긴다", async () => {
    const { controller, service } = makeController();
    await controller.requestCorrection({ id: "u1" }, "a1", {
      is_subject: true,
      correction_text: "정정",
    });
    expect(service.requestCorrection).toHaveBeenCalledWith("u1", "a1", {
      isSubject: true,
      correctionText: "정정",
    });
  });
});
