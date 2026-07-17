import { ArrayNotEmpty, IsArray, IsIn, IsOptional } from "class-validator";

import { OUTLET_KEYS, type OutletKey } from "../adaptation/adaptation.types";

export class RegenerateReportDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(OUTLET_KEYS, { each: true })
  outlet_keys?: OutletKey[];
}
