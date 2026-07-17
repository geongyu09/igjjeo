import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "올바른 이메일 형식이 아닙니다" })
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
