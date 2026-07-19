import type { ReportsService } from "./reports.service";

import { ReportsController } from "./reports.controller";

function makeController() {
  const service = {
    createReport: jest.fn(),
    regenerate: jest.fn(),
    publish: jest.fn(),
    getReport: jest.fn(),
    getReportQuota: jest.fn(),
    refillReportQuota: jest.fn(),
  } as unknown as jest.Mocked<ReportsService>;
  return { controller: new ReportsController(service), service };
}

describe("ReportsController", () => {
  it("create 는 body 를 서비스 입력(camelCase)으로 변환해 넘긴다", async () => {
    const { controller, service } = makeController();

    await controller.create({ id: "u1" }, "g1", {
      raw_text: "원문",
      photo_url: "https://x/a.jpg",
      outlet_keys: ["daily"],
      is_self_report: true,
    });

    expect(service.createReport).toHaveBeenCalledWith("u1", "g1", {
      rawText: "원문",
      photoUrl: "https://x/a.jpg",
      outletKeys: ["daily"],
      isSelfReport: true,
    });
  });

  it("create 는 photo_url 이 없으면 null 로 넘긴다", async () => {
    const { controller, service } = makeController();

    await controller.create({ id: "u1" }, "g1", { raw_text: "원문" });

    expect(service.createReport).toHaveBeenCalledWith("u1", "g1", {
      rawText: "원문",
      photoUrl: null,
      outletKeys: undefined,
      isSelfReport: undefined,
    });
  });

  it("regenerate 는 outlet_keys 를 서비스로 전달한다", async () => {
    const { controller, service } = makeController();

    await controller.regenerate({ id: "u1" }, "r1", { outlet_keys: ["shock"] });

    expect(service.regenerate).toHaveBeenCalledWith("u1", "r1", ["shock"]);
  });

  it("publish 는 선택 outlet_keys 를 서비스로 전달한다", async () => {
    const { controller, service } = makeController();

    await controller.publish({ id: "u1" }, "r1", { outlet_keys: ["daily"] });

    expect(service.publish).toHaveBeenCalledWith("u1", "r1", ["daily"]);
  });

  it("getOne 은 제보 초안을 조회한다", async () => {
    const { controller, service } = makeController();

    await controller.getOne({ id: "u1" }, "r1");

    expect(service.getReport).toHaveBeenCalledWith("u1", "r1");
  });

  it("getReportQuota 는 현재 사용자의 제보 한도를 조회한다", async () => {
    const { controller, service } = makeController();

    await controller.getReportQuota({ id: "u1" });

    expect(service.getReportQuota).toHaveBeenCalledWith("u1");
  });

  it("refillReportQuota 는 현재 사용자의 제보 한도를 충전한다", async () => {
    const { controller, service } = makeController();

    await controller.refillReportQuota({ id: "u1" });

    expect(service.refillReportQuota).toHaveBeenCalledWith("u1");
  });
});
