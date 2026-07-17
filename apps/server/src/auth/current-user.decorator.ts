import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

/** 인증된 요청자. 지금은 sub(profiles.id) 만 싣는다. */
export interface AuthUser {
  id: string;
}

/**
 * 컨트롤러 핸들러에서 요청자(AuthUser)를 꺼낸다.
 * JwtUserGuard 가 request.user 를 채워 둔 것을 읽어 온다.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user as AuthUser;
  },
);
