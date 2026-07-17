import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";

import { CurrentUser, type AuthUser } from "./current-user.decorator";
import { AuthService, type AuthBundle, type TokenBundle } from "./auth.service";
import { JwtUserGuard } from "./jwt-user.guard";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignupDto } from "./dto/signup.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/signup — 이메일+비밀번호 회원가입. */
  @Post("signup")
  @HttpCode(201)
  signup(@Body() dto: SignupDto): Promise<AuthBundle> {
    return this.auth.signup({
      email: dto.email,
      password: dto.password,
      displayName: dto.display_name,
    });
  }

  /** POST /v1/auth/login — 로그인, 토큰 번들 발급. */
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<AuthBundle> {
    return this.auth.login({ email: dto.email, password: dto.password });
  }

  /** POST /v1/auth/token/refresh — 리프레시 토큰 회전 재발급. */
  @Post("token/refresh")
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenBundle> {
    return this.auth.refresh(dto.refresh_token);
  }

  /** POST /v1/auth/logout — 현재 세션의 리프레시 토큰 폐기. */
  @Post("logout")
  @HttpCode(204)
  @UseGuards(JwtUserGuard)
  logout(
    @CurrentUser() user: AuthUser,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    return this.auth.logout(user.id, dto.refresh_token);
  }
}
