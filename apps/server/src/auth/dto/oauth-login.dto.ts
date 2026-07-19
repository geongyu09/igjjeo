import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/** 소셜 로그인 요청. 네이티브가 provider id_token 을 받아 그대로 넘긴다. */
export class OAuthLoginDto {
  @IsIn(["google", "apple"], { message: "지원하지 않는 로그인 제공자입니다" })
  provider!: "google" | "apple";

  @IsString()
  @MinLength(1)
  id_token!: string;

  // 신규 가입 시 초기 표시 이름 프리필용(예: Apple 최초 동의 시 전달되는 이름).
  // 검증은 provider id_token 으로 하고, 이 값은 표시 이름 초기값에만 쓴다.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}
