import { Global, Module } from "@nestjs/common";

import { ProfilesModule } from "@/profiles/profiles.module";

import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { JwtUserGuard } from "./jwt-user.guard";
import { OAuthVerifierService } from "./oauth-verifier.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

/**
 * 인증·세션 토큰 영역. JwtUserGuard·TokenService 는 방-스코프 등 다른 모듈의
 * 컨트롤러에서 두루 쓰이므로 @Global 로 노출한다(각 모듈이 import 하지 않아도 됨).
 */
@Global()
@Module({
  imports: [ProfilesModule],
  controllers: [AuthController],
  providers: [
    PasswordService,
    TokenService,
    JwtUserGuard,
    AuthRepository,
    AuthService,
    OAuthVerifierService,
  ],
  exports: [JwtUserGuard, TokenService],
})
export class AuthModule {}
