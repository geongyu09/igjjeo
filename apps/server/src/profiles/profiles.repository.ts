import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";
import type { Json } from "@/infra/supabase/database.types";

/** profiles 테이블 한 행. */
export interface ProfileRow {
  id: string;
  display_name: string;
  masked_name: string;
  avatar_url: string | null;
  onboarded: boolean;
  created_at: string;
}

/** 갱신 가능한 프로필 필드. masked_name 은 서버가 파생해 함께 넣는다. */
export interface ProfilePatch {
  display_name?: string;
  masked_name?: string;
  avatar_url?: string | null;
  onboarded?: boolean;
}

const COLUMNS =
  "id, display_name, masked_name, avatar_url, onboarded, created_at";

@Injectable()
export class ProfilesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase.client
      .from("profiles")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as ProfileRow | null) ?? null;
  }

  async update(id: string, patch: ProfilePatch): Promise<ProfileRow> {
    const { data, error } = await this.supabase.client
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return data as ProfileRow;
  }

  /** 방 안에서의 내 프로필 요약(통계 + 내 제보 목록). 집계는 RPC 안에서 완성된다. */
  async getMemberProfileSummary(
    groupId: string,
    userId: string,
  ): Promise<Json> {
    const { data, error } = await this.supabase.client.rpc(
      "get_member_profile_summary",
      { p_group_id: groupId, p_user_id: userId },
    );

    if (error) {
      throw error;
    }

    return data as Json;
  }
}
