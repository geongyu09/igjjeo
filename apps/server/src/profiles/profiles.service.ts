import { Injectable, NotFoundException } from "@nestjs/common";

import { deriveMaskedName } from "./masked-name";
import { toProfileResponse, type ProfileResponse } from "./profile.response";
import { ProfilesRepository, type ProfilePatch } from "./profiles.repository";

export interface UpdateMeInput {
  display_name?: string;
  avatar_url?: string | null;
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
}
