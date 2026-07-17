import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";

/** profiles 테이블 한 행. */
export interface ProfileRow {
  id: string;
  display_name: string;
  masked_name: string;
  avatar_url: string | null;
  created_at: string;
}

/** 갱신 가능한 프로필 필드. masked_name 은 서버가 파생해 함께 넣는다. */
export interface ProfilePatch {
  display_name?: string;
  masked_name?: string;
  avatar_url?: string | null;
}

const COLUMNS = "id, display_name, masked_name, avatar_url, created_at";

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
}
