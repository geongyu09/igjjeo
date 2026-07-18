import { Injectable, NotFoundException } from "@nestjs/common";

import type { Json } from "@/infra/supabase/database.types";

import { deriveMaskedName } from "./masked-name";
import { toProfileResponse, type ProfileResponse } from "./profile.response";
import { ProfilesRepository, type ProfilePatch } from "./profiles.repository";

export interface UpdateMeInput {
  display_name?: string;
  avatar_url?: string | null;
}

/** 프로필 화면(07)의 방-스코프 요약: 통계 + 내가 낸 제보 목록. */
export interface MemberProfileSummary {
  stats: { reports: number; reactions: number; scoops: number };
  reports: {
    id: string;
    outlet_key: string;
    headline: string;
    reaction_count: number;
  }[];
}

@Injectable()
export class ProfilesService {
  constructor(private readonly profiles: ProfilesRepository) {}

  async getMe(userId: string): Promise<ProfileResponse> {
    const row = await this.profiles.findById(userId);
    if (!row) {
      throw new NotFoundException({
        error: { code: "not_found", message: "프로필을 찾을 수 없습니다" },
      });
    }
    return toProfileResponse(row);
  }

  async updateMe(
    userId: string,
    input: UpdateMeInput,
  ): Promise<ProfileResponse> {
    const patch: ProfilePatch = {};

    if (input.display_name !== undefined) {
      const displayName = input.display_name.trim();
      patch.display_name = displayName;
      // 서버가 masked_name 을 파생해 클라이언트 위조를 막는다(auth-profile.md).
      patch.masked_name = deriveMaskedName(displayName);
      // 이름 저장 = 기본 정보 입력 완료. 소셜 신규 가입의 온보딩을 여기서 닫는다.
      patch.onboarded = true;
    }
    if (input.avatar_url !== undefined) {
      patch.avatar_url = input.avatar_url;
    }

    // 바꿀 필드가 없으면 불필요한 쓰기를 피하고 현재 값을 반환한다.
    if (Object.keys(patch).length === 0) {
      return this.getMe(userId);
    }

    const row = await this.profiles.update(userId, patch);
    return toProfileResponse(row);
  }

  /** 방 안에서의 내 프로필 요약(통계 + 내 제보 목록). 집계는 RPC 가 완성한다. */
  async getMemberProfileSummary(
    userId: string,
    groupId: string,
  ): Promise<MemberProfileSummary> {
    const summary = await this.profiles.getMemberProfileSummary(
      groupId,
      userId,
    );
    return summary as unknown as MemberProfileSummary;
  }
}
