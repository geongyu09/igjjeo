import { IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: "refresh_token 이 필요합니다" })
  refresh_token!: string;
}
