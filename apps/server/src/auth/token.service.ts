import {
  createHmac,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";

/** 액세스 토큰 수명(초). 짧게 두고 리프레시로 재발급한다(conventions.md §2). */
const ACCESS_TTL_SEC = 15 * 60;
/** 리프레시 토큰 수명(초). 회전식이므로 길게 둔다. */
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;

export interface AccessTokenResult {
  token: string;
  expiresIn: number;
}

export type VerifyResult =
  | { valid: true; sub: string }
  | { valid: false; reason: "expired" | "invalid" };

export interface RefreshTokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

interface AccessPayload {
  sub: string;
  iat: number;
  exp: number;
}

const HEADER_B64 = base64url(
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })),
);

/**
 * 세션 토큰 발급·검증(자체 발급 JWT). 외부 JWT 라이브러리 없이 Node crypto 로
 * HS256 서명한다. 리프레시 토큰은 JWT 가 아니라 불투명 랜덤 문자열이며, 저장소에는
 * 해시만 보관한다(유출 시 원문 복원 불가).
 */
@Injectable()
export class TokenService {
  private readonly secret: string;

  constructor(config: ConfigService<AppEnv, true>) {
    this.secret = config.get("JWT_SECRET", { infer: true });
  }

  signAccessToken(sub: string, opts?: { ttlSec?: number }): AccessTokenResult {
    const ttl = opts?.ttlSec ?? ACCESS_TTL_SEC;
    const iat = Math.floor(Date.now() / 1000);
    const payload: AccessPayload = { sub, iat, exp: iat + ttl };

    const body = `${HEADER_B64}.${base64url(Buffer.from(JSON.stringify(payload)))}`;
    const token = `${body}.${this.sign(body)}`;

    return { token, expiresIn: ttl };
  }

  verifyAccessToken(token: string): VerifyResult {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, reason: "invalid" };
    }

    const [header, payload, signature] = parts;
    const expected = this.sign(`${header}.${payload}`);
    if (!safeEqual(signature, expected)) {
      return { valid: false, reason: "invalid" };
    }

    let decoded: AccessPayload;
    try {
      decoded = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as AccessPayload;
    } catch {
      return { valid: false, reason: "invalid" };
    }

    if (typeof decoded.sub !== "string" || typeof decoded.exp !== "number") {
      return { valid: false, reason: "invalid" };
    }
    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true, sub: decoded.sub };
  }

  generateRefreshToken(): RefreshTokenResult {
    const token = randomBytes(32).toString("hex");
    return {
      token,
      tokenHash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private sign(body: string): string {
    return base64url(createHmac("sha256", this.secret).update(body).digest());
  }
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
