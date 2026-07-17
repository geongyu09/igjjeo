import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { ProfileRow } from "@/profiles/profiles.repository";

/** 이메일 중복(auth_credentials.email unique 위반). 서비스가 409 로 매핑한다. */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export interface CreateAccountInput {
  email: string;
  passwordHash: string;
  displayName: string;
  maskedName: string;
}

export interface CredentialRow {
  profile_id: string;
  password_hash: string;
}

export interface RefreshTokenRow {
  id: string;
  profile_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

const PG_UNIQUE_VIOLATION = "23505";

/**
 * 인증 저장소(auth_credentials·refresh_tokens) 데이터 접근. profiles 와 분리된
 * 인증 데이터만 다룬다(프로필 읽기/쓰기는 ProfilesRepository).
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** 프로필 + 크리덴셜 원자 생성(RPC). 이메일 중복이면 EmailAlreadyExistsError. */
  async createAccount(input: CreateAccountInput): Promise<ProfileRow> {
    const { data, error } = await this.supabase.client.rpc("create_account", {
      p_email: input.email,
      p_password_hash: input.passwordHash,
      p_display_name: input.displayName,
      p_masked_name: input.maskedName,
    });

    if (error) {
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }

    const row = data?.[0];
    if (!row) {
      throw new Error("create_account 가 행을 반환하지 않았습니다");
    }

    return row;
  }

  async findCredentialByEmail(email: string): Promise<CredentialRow | null> {
    const { data, error } = await this.supabase.client
      .from("auth_credentials")
      .select("profile_id, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as CredentialRow | null) ?? null;
  }

  async insertRefreshToken(input: {
    profileId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const { error } = await this.supabase.client.from("refresh_tokens").insert({
      profile_id: input.profileId,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt.toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const { data, error } = await this.supabase.client
      .from("refresh_tokens")
      .select("id, profile_id, token_hash, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as RefreshTokenRow | null) ?? null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }

  /** 재사용 감지 시 해당 사용자의 살아있는 모든 리프레시 토큰을 폐기(세션 전체 종료). */
  async revokeAllForProfile(profileId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("profile_id", profileId)
      .is("revoked_at", null);

    if (error) {
      throw error;
    }
  }
}
