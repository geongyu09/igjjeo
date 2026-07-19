import type { ProfileRow } from "./profiles.repository";

/** 외부로 나가는 프로필 표현(Profile). conventions.md 표준 리소스 형태. */
export interface ProfileResponse {
  id: string;
  display_name: string;
  masked_name: string;
  avatar_url: string | null;
  /** 온보딩(이름 등 기본 정보 입력) 완료 여부. 소셜 신규 가입만 false 로 시작한다. */
  onboarded: boolean;
  created_at: string;
}

export function toProfileResponse(row: ProfileRow): ProfileResponse {
  return {
    id: row.id,
    display_name: row.display_name,
    masked_name: row.masked_name,
    avatar_url: row.avatar_url,
    onboarded: row.onboarded,
    created_at: row.created_at,
  };
}
