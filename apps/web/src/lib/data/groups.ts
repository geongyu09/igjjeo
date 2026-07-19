/**
 * 방·멤버십 데이터 접근 계층 (groups.md).
 * 방은 모든 데이터 격리의 경계 — 방-스코프 리소스 인가의 근거가 된다.
 */

import { apiClient } from "@/lib/api/client";
import type { Group, Member, Paginated, PageParams } from "@/lib/api/types";

export interface CreateGroupParams {
  name: string;
  /** 방 각색 키워드(선택, 최대 100자). 이 방의 뉴스 각색 프롬프트에 반영된다. */
  keyword?: string;
}

export async function createGroup({
  name,
  keyword,
}: CreateGroupParams): Promise<Group> {
  const body: { name: string; keyword?: string } = { name };
  if (keyword) {
    body.keyword = keyword;
  }
  const { data } = await apiClient.post<Group>("/groups", body);
  return data;
}

/** 내가 속한 방 목록(커서 페이지네이션). */
export async function listGroups(
  params: PageParams = {},
): Promise<Paginated<Group>> {
  const { data } = await apiClient.get<Paginated<Group>>("/groups", { params });
  return data;
}

export interface GroupIdParams {
  groupId: string;
}

export async function getGroup({ groupId }: GroupIdParams): Promise<Group> {
  const { data } = await apiClient.get<Group>(`/groups/${groupId}`);
  return data;
}

export interface UpdateGroupParams extends GroupIdParams {
  name: string;
}

export async function updateGroup({
  groupId,
  name,
}: UpdateGroupParams): Promise<Group> {
  const { data } = await apiClient.patch<Group>(`/groups/${groupId}`, { name });
  return data;
}

/** 초대 코드 재발급(owner 전용, 유출 대응). */
export async function rotateInviteCode({
  groupId,
}: GroupIdParams): Promise<{ invite_code: string }> {
  const { data } = await apiClient.post<{ invite_code: string }>(
    `/groups/${groupId}/invite-code/rotate`,
  );
  return data;
}

export interface JoinGroupParams {
  inviteCode: string;
}

/** 초대 코드로 방 참여(이미 멤버면 멱등). */
export async function joinGroup({
  inviteCode,
}: JoinGroupParams): Promise<Group> {
  const { data } = await apiClient.post<Group>("/groups/join", {
    invite_code: inviteCode,
  });
  return data;
}

export async function listMembers({
  groupId,
}: GroupIdParams): Promise<{ items: Member[] }> {
  const { data } = await apiClient.get<{ items: Member[] }>(
    `/groups/${groupId}/members`,
  );
  return data;
}

export interface RemoveMemberParams extends GroupIdParams {
  userId: string;
}

/** 방 나가기(본인) 또는 강퇴(owner). */
export async function removeMember({
  groupId,
  userId,
}: RemoveMemberParams): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
}
