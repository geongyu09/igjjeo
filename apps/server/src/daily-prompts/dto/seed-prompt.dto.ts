import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class SeedPromptDto {
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(200)
  question!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date 는 YYYY-MM-DD 형식이어야 합니다",
  })
  date!: string;
}
