import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CorrectionRequestDto {
  @IsBoolean()
  is_subject!: boolean;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(500)
  correction_text!: string;
}
