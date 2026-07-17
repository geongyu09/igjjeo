import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import type { AuthUser } from "./current-user.decorator";
import { TokenService } from "./token.service";

/**
 * 액세스 토큰 인증 가드. `Authorization: Bearer <token>` 의 서명·만료를 TokenService 로
 * 검증하고, 유효하면 payload 의 `sub`(=profiles.id)를 request.user 에 실어 준다.
 *
 * - 서명 위조·형식 오류: 401 `unauthorized`.
 * - 만료: 401 `token_expired` → 클라이언트가 /auth/token/refresh 로 재발급(conventions.md §2).
 */
@Injectable()
export class JwtUserGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, unknown>; user?: AuthUser }>();

    const token = extractBearer(request.headers?.authorization);
    if (!token) {
      throw unauthorized("unauthorized", "유효한 인증 토큰이 필요합니다");
    }

    const result = this.tokens.verifyAccessToken(token);
    if (!result.valid) {
      throw result.reason === "expired"
        ? unauthorized("token_expired", "토큰이 만료되었습니다")
        : unauthorized("unauthorized", "유효한 인증 토큰이 필요합니다");
    }

    request.user = { id: result.sub };
    return true;
  }
}

function extractBearer(header: unknown): string | null {
  if (typeof header !== "string") return null;

  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function unauthorized(code: string, message: string): UnauthorizedException {
  return new UnauthorizedException({ error: { code, message } });
}
