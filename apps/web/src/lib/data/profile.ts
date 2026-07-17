/**
 * 프로필 데이터 접근 계층 (auth-profile.md).
 * masked_name은 서버가 파생하므로 클라이언트는 display_name·avatar_url만 보낸다.
 */

import { apiClient } from "@/lib/api/client";
import type { Profile } from "@/lib/api/types";

export async function getMe(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>("/me");
  return data;
}

export interface UpdateMeParams {
  displayName?: string;
  avatarUrl?: string;
}

export async function updateMe({
  displayName,
  avatarUrl,
}: UpdateMeParams): Promise<Profile> {
  const { data } = await apiClient.patch<Profile>("/me", {
    display_name: displayName,
    avatar_url: avatarUrl,
  });
  return data;
}
