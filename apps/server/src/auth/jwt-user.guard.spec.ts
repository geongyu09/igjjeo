import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import { JwtUserGuard } from "./jwt-user.guard";
import { TokenService } from "./token.service";

function makeTokens(secret = "guard-test-secret"): TokenService {
  const config = {
    get: (key: keyof AppEnv) => (key === "JWT_SECRET" ? secret : undefined),
  } as unknown as ConfigService<AppEnv, true>;
  return new TokenService(config);
}

function contextWith(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as Parameters<JwtUserGuard["canActivate"]>[0];
}

describe("JwtUserGuard", () => {
  const tokens = makeTokens();
  const guard = new JwtUserGuard(tokens);

  it("유효한 Bearer 토큰의 sub 를 request.user.id 로 설정한다", () => {
    const { token } = tokens.signAccessToken("user-1");
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(guard.canActivate(contextWith(request))).toBe(true);
    expect(request.user).toEqual({ id: "user-1" });
  });

  it("Authorization 헤더가 없으면 401 unauthorized 를 던진다", () => {
    expect(() => guard.canActivate(contextWith({ headers: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  it("서명이 위조된 토큰이면 401 을 던진다", () => {
    const { token } = tokens.signAccessToken("user-1");
    const request = {
      headers: { authorization: `Bearer ${token.slice(0, -2)}xx` },
    };

    expect(() => guard.canActivate(contextWith(request))).toThrow(
      UnauthorizedException,
    );
  });

  it("만료된 토큰이면 token_expired 코드로 401 을 던진다", () => {
    const { token } = tokens.signAccessToken("user-1", { ttlSec: -1 });
    const request = { headers: { authorization: `Bearer ${token}` } };

    try {
      guard.canActivate(contextWith(request));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toEqual({
        error: { code: "token_expired", message: expect.any(String) },
      });
    }
  });
});
