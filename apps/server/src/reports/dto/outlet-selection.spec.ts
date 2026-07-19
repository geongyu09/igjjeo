import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { MAX_OUTLET_SELECTION } from "../adaptation/adaptation.types";
import { CreateReportDto } from "./create-report.dto";
import { PublishReportDto } from "./publish-report.dto";
import { RegenerateReportDto } from "./regenerate-report.dto";

const outletErrors = (dto: object) =>
  validateSync(dto).filter((error) => error.property === "outlet_keys");

describe("언론사 선택 개수 제한", () => {
  it("한도는 3곳이다", () => {
    expect(MAX_OUTLET_SELECTION).toBe(3);
  });

  describe("CreateReportDto", () => {
    it(`언론사를 ${MAX_OUTLET_SELECTION}곳까지 고르면 통과한다`, () => {
      const dto = plainToInstance(CreateReportDto, {
        raw_text: "지각했다",
        outlet_keys: ["daily", "shock", "science"],
      });
      expect(outletErrors(dto)).toHaveLength(0);
    });

    it(`언론사를 ${MAX_OUTLET_SELECTION}곳 넘게 고르면 거절한다`, () => {
      const dto = plainToInstance(CreateReportDto, {
        raw_text: "지각했다",
        outlet_keys: ["daily", "shock", "science", "emotion"],
      });
      expect(outletErrors(dto)).toHaveLength(1);
    });
  });

  describe("RegenerateReportDto", () => {
    it(`언론사를 ${MAX_OUTLET_SELECTION}곳 넘게 고르면 거절한다`, () => {
      const dto = plainToInstance(RegenerateReportDto, {
        outlet_keys: ["daily", "shock", "science", "emotion"],
      });
      expect(outletErrors(dto)).toHaveLength(1);
    });
  });

  describe("PublishReportDto", () => {
    it(`언론사를 ${MAX_OUTLET_SELECTION}곳 넘게 고르면 거절한다`, () => {
      const dto = plainToInstance(PublishReportDto, {
        outlet_keys: ["daily", "shock", "science", "emotion"],
      });
      expect(outletErrors(dto)).toHaveLength(1);
    });
  });
});
