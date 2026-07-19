import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

import {
  MAX_OUTLET_SELECTION,
  OUTLET_KEYS,
  type OutletKey,
} from "../adaptation/adaptation.types";

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  raw_text!: string;

  @IsOptional()
  @IsUrl()
  photo_url?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_OUTLET_SELECTION)
  @IsIn(OUTLET_KEYS, { each: true })
  outlet_keys?: OutletKey[];

  @IsOptional()
  @IsBoolean()
  is_self_report?: boolean;
}
