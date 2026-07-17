import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { deriveMaskedName } from "@/profiles/masked-name";
import {
  toProfileResponse,
  type ProfileResponse,
} from "@/profiles/profile.response";
import {
  ProfilesRepository,
  type ProfileRow,
} from "@/profiles/profiles.repository";

import { AuthRepository, EmailAlreadyExistsError } from "./auth.repository";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

export interface TokenBundle {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthBundle extends TokenBundle {
  profile: ProfileResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly auth: AuthRepository,
    private readonly profiles: ProfilesRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async signup(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthBundle> {
    const email = normalizeEmail(input.email);
    const passwordHash = await this.passwords.hash(input.password);
    const displayName = input.displayName.trim();

    let profile: ProfileRow;
    try {
      profile = await this.auth.createAccount({
        email,
        passwordHash,
        displayName,
        maskedName: deriveMaskedName(displayName),
      });
    } catch (err) {
      if (err instanceof EmailAlreadyExistsError) {
        throw new ConflictException({
          error: { code: "conflict", message: "이미 가입된 이메일입니다" },
        });
      }
      throw err;
    }

    const bundle = await this.issueTokens(profile.id);
    return { profile: toProfileResponse(profile), ...bundle };
  }

  async login(input: { email: string; password: string }): Promise<AuthBundle> {
    const email = normalizeEmail(input.email);
    const credential = await this.auth.findCredentialByEmail(email);
    // 이메일 존재 여부를 응답으로 구분해 노출하지 않는다(auth-profile.md).
    if (!credential) {
      throw invalidCredentials();
    }

    const ok = await this.passwords.verify(
      input.password,
      credential.password_hash,
    );
    if (!ok) {
      throw invalidCredentials();
    }

    const profile = await this.profiles.findById(credential.profile_id);
    if (!profile) {
      throw invalidCredentials();
    }

    const bundle = await this.issueTokens(profile.id);
    return { profile: toProfileResponse(profile), ...bundle };
  }

  async refresh(refreshToken: string): Promise<TokenBundle> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const row = await this.auth.findRefreshToken(tokenHash);
    if (!row) {
      throw invalidRefresh();
    }

    // 이미 폐기된 토큰의 재제시 = 탈취 의심 → 해당 사용자 세션 전체 폐기.
    if (row.revoked_at !== null) {
      await this.auth.revokeAllForProfile(row.profile_id);
      throw invalidRefresh();
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      throw invalidRefresh();
    }

    await this.auth.revokeRefreshToken(row.id);
    return this.issueTokens(row.profile_id);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const row = await this.auth.findRefreshToken(tokenHash);
    // 본인 소유의 살아있는 토큰만 폐기. 그 외에는 멱등적으로 무시(204).
    if (row && row.profile_id === userId && row.revoked_at === null) {
      await this.auth.revokeRefreshToken(row.id);
    }
  }

  private async issueTokens(profileId: string): Promise<TokenBundle> {
    const access = this.tokens.signAccessToken(profileId);
    const refresh = this.tokens.generateRefreshToken();
    await this.auth.insertRefreshToken({
      profileId,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });

    return {
      access_token: access.token,
      refresh_token: refresh.token,
      expires_in: access.expiresIn,
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    error: {
      code: "unauthorized",
      message: "이메일 또는 비밀번호가 올바르지 않습니다",
    },
  });
}

function invalidRefresh(): UnauthorizedException {
  return new UnauthorizedException({
    error: {
      code: "unauthorized",
      message: "유효하지 않은 리프레시 토큰입니다",
    },
  });
}
