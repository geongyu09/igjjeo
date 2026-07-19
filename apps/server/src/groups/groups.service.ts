import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { decodeCursor, encodeCursor } from "@/common/cursor";

import {
  GroupsRepository,
  type GroupRecord,
  type MemberRow,
  type MyGroupRow,
} from "./groups.repository";

/** POST /groups 등 응답(Group). conventions.md 표준 리소스 형태. */
export interface GroupResponse {
  id: string;
  name: string;
  invite_code: string;
  role: string;
  member_count: number;
  created_at: string;
}

export interface GroupListResponse {
  items: GroupResponse[];
  next_cursor: string | null;
}

export interface PageQuery {
  limit?: number;
  cursor?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class GroupsService {
  constructor(private readonly groups: GroupsRepository) {}

  async createGroup(
    userId: string,
    name: string,
    keyword?: string | null,
  ): Promise<GroupResponse> {
    const row = await this.groups.createGroupWithOwner(
      userId,
      name,
      keyword ?? null,
    );
    return toGroupResponse(row);
  }

  async listMyGroups(
    userId: string,
    query: PageQuery,
  ): Promise<GroupListResponse> {
    const limit = clampLimit(query.limit);
    const before = decodeCursor(query.cursor);

    // 다음 페이지 존재 여부를 알기 위해 한 건 더 조회한다.
    const rows = await this.groups.listMyGroups(userId, limit + 1, before);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    const nextCursor =
      hasMore && page.length > 0
        ? encodeCursor(page[page.length - 1].joined_at)
        : null;

    return {
      items: page.map(toGroupResponse),
      next_cursor: nextCursor,
    };
  }

  async getGroup(groupId: string, role: string): Promise<GroupResponse> {
    const summary = await this.groups.getSummary(groupId);
    if (!summary) {
      throw notFound();
    }

    return {
      id: summary.id,
      name: summary.name,
      invite_code: summary.invite_code,
      role,
      member_count: Number(summary.member_count),
      created_at: summary.created_at,
    };
  }

  async rename(
    groupId: string,
    role: string,
    name: string,
  ): Promise<GroupResponse> {
    assertOwner(role);
    await this.groups.updateName(groupId, name);
    return this.getGroup(groupId, role);
  }

  async rotateInvite(
    groupId: string,
    role: string,
  ): Promise<{ invite_code: string }> {
    assertOwner(role);
    const inviteCode = await this.groups.rotateInviteCode(groupId);
    return { invite_code: inviteCode };
  }

  async join(userId: string, inviteCode: string): Promise<GroupResponse> {
    const row = await this.groups.joinGroup(userId, inviteCode);
    if (!row) {
      throw notFound();
    }
    return toGroupResponse(row);
  }

  async listMembers(groupId: string): Promise<{ items: MemberRow[] }> {
    const items = await this.groups.listMembers(groupId);
    return { items };
  }

  async removeMember(
    groupId: string,
    requesterId: string,
    requesterRole: string,
    targetUserId: string,
  ): Promise<void> {
    // 본인 탈퇴 또는 owner 강퇴만 허용. 방 격리와 무관한 권한 문제이므로 403.
    if (requesterId !== targetUserId && requesterRole !== "owner") {
      throw new ForbiddenException({
        error: { code: "forbidden", message: "멤버를 내보낼 권한이 없습니다" },
      });
    }

    const deleted = await this.groups.deleteMembership(groupId, targetUserId);
    if (!deleted) {
      throw notFound();
    }
  }
}

function toGroupResponse(row: GroupRecord | MyGroupRow): GroupResponse {
  return {
    id: row.id,
    name: row.name,
    invite_code: row.invite_code,
    role: row.role,
    member_count: Number(row.member_count),
    created_at: row.created_at,
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(limit, MAX_LIMIT);
}

function assertOwner(role: string): void {
  if (role !== "owner") {
    throw new ForbiddenException({
      error: { code: "forbidden", message: "방 관리자만 할 수 있습니다" },
    });
  }
}

function notFound(): NotFoundException {
  return new NotFoundException({
    error: { code: "not_found", message: "방을 찾을 수 없습니다" },
  });
}
