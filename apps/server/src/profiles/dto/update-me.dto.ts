import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "표시 이름을 입력해 주세요" })
  @MaxLength(50)
  display_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar_url?: string;
}
