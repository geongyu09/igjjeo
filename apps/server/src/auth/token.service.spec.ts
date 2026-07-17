import type { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

import { TokenService } from "./token.service";

function makeService(secret = "unit-test-secret"): TokenService {
  const config = {
    get: (key: keyof AppEnv) => (key === "JWT_SECRET" ? secret : undefined),
  } as unknown as ConfigService<AppEnv, true>;
  return new TokenService(config);
}

describe("TokenService", () => {
  describe("액세스 토큰", () => {
    it("sub 를 담은 토큰을 발급하고 검증 시 되돌려준다", () => {
      const service = makeService();
      const { token, expiresIn } = service.signAccessToken("user-1");

      expect(expiresIn).toBeGreaterThan(0);
      const result = service.verifyAccessToken(token);
      expect(result).toEqual({ valid: true, sub: "user-1" });
    });

    it("서명이 위조되면 invalid 로 거부한다", () => {
      const service = makeService();
      const { token } = service.signAccessToken("user-1");
      const tampered = `${token.slice(0, -2)}xx`;

      expect(service.verifyAccessToken(tampered)).toEqual({
        valid: false,
        reason: "invalid",
      });
    });

    it("다른 시크릿으로 서명된 토큰은 거부한다", () => {
      const signed = makeService("secret-a").signAccessToken("user-1").token;

      expect(makeService("secret-b").verifyAccessToken(signed)).toEqual({
        valid: false,
        reason: "invalid",
      });
    });

    it("만료된 토큰은 expired 로 구분해 거부한다", () => {
      const service = makeService();
      const { token } = service.signAccessToken("user-1", { ttlSec: -1 });

      expect(service.verifyAccessToken(token)).toEqual({
        valid: false,
        reason: "expired",
      });
    });

    it("형식이 깨진 토큰은 invalid", () => {
      expect(makeService().verifyAccessToken("nope")).toEqual({
        valid: false,
        reason: "invalid",
      });
    });
  });

  describe("리프레시 토큰", () => {
    it("불투명 토큰과 그 해시·만료를 함께 생성한다", () => {
      const service = makeService();
      const { token, tokenHash, expiresAt } = service.generateRefreshToken();

      expect(token).toMatch(/^[0-9a-f]{64}$/);
      expect(tokenHash).not.toBe(token);
      expect(service.hashRefreshToken(token)).toBe(tokenHash);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("매번 다른 토큰을 만든다", () => {
      const service = makeService();
      expect(service.generateRefreshToken().token).not.toBe(
        service.generateRefreshToken().token,
      );
    });
  });
});
