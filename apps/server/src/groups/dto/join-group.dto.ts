import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class JoinGroupDto {
  // 초대 코드는 대문자+숫자. 대소문자 혼용 입력을 관대하게 정규화한다.
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  invite_code!: string;
}
