import { ArrayNotEmpty, IsArray, IsIn } from "class-validator";

import { OUTLET_KEYS, type OutletKey } from "../adaptation/adaptation.types";

export class PublishReportDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(OUTLET_KEYS, { each: true })
  outlet_keys!: OutletKey[];
}
