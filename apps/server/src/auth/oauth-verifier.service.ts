import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

import type { AppEnv } from "@/config/env.validation";

export type OAuthProvider = "google" | "apple";

/** provider id_token 에서 검증·추출한 신원. */
export interface VerifiedIdentity {
  /** provider 안에서 사용자를 유일하게 식별하는 값(id_token sub). */
  subject: string;
  email?: string;
  name?: string;
}

/** provider 별 발급자(iss)와 JWKS 엔드포인트. */
const PROVIDER_META: Record<
  OAuthProvider,
  { issuers: readonly string[]; jwksUri: string }
> = {
  google: {
    issuers: ["https://accounts.google.com", "accounts.google.com"],
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  },
  apple: {
    issuers: ["https://appleid.apple.com"],
    jwksUri: "https://appleid.apple.com/auth/keys",
  },
};

/**
 * 소셜 로그인 id_token 검증기. Google·Apple 의 JWKS 로 서명을 검증하고
 * issuer·audience 를 확인한 뒤 신원(sub·email·name)을 뽑는다.
 *
 * 자체 세션 토큰은 TokenService(Node crypto HS256)가 계속 발급한다 — 여기서는
 * 외부 provider 의 RS256 토큰 검증만 jose 로 처리한다. JWKS 는 provider 별로
 * 한 번 만들어 재사용하며 jose 가 내부적으로 캐싱한다.
 */
@Injectable()
export class OAuthVerifierService {
  private readonly audiences: Record<OAuthProvider, string>;
  private readonly jwks: Record<OAuthProvider, JWTVerifyGetKey>;

  constructor(config: ConfigService<AppEnv, true>) {
    this.audiences = {
      google: config.get("GOOGLE_OAUTH_CLIENT_ID", { infer: true }),
      apple: config.get("APPLE_OAUTH_CLIENT_ID", { infer: true }),
    };
    this.jwks = {
      google: createRemoteJWKSet(new URL(PROVIDER_META.google.jwksUri)),
      apple: createRemoteJWKSet(new URL(PROVIDER_META.apple.jwksUri)),
    };
  }

  async verify(
    provider: OAuthProvider,
    idToken: string,
  ): Promise<VerifiedIdentity> {
    let payload: Record<string, unknown>;
    try {
      const verified = await jwtVerify(idToken, this.jwks[provider], {
        issuer: [...PROVIDER_META[provider].issuers],
        audience: this.audiences[provider],
      });
      payload = verified.payload;
    } catch {
      throw invalidIdToken();
    }

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw invalidIdToken();
    }

    return {
      subject: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  }
}

function invalidIdToken(): UnauthorizedException {
  return new UnauthorizedException({
    error: { code: "unauthorized", message: "소셜 로그인 검증에 실패했습니다" },
  });
}
