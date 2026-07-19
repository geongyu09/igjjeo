import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn } from "class-validator";

import {
  MAX_OUTLET_SELECTION,
  OUTLET_KEYS,
  type OutletKey,
} from "../adaptation/adaptation.types";

export class PublishReportDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_OUTLET_SELECTION)
  @IsIn(OUTLET_KEYS, { each: true })
  outlet_keys!: OutletKey[];
}
