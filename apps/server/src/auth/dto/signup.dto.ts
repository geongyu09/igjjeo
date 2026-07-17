import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class SignupDto {
  @IsEmail({}, { message: "올바른 이메일 형식이 아닙니다" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "비밀번호는 8자 이상이어야 합니다" })
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(1, { message: "표시 이름을 입력해 주세요" })
  @MaxLength(50)
  display_name!: string;
}
