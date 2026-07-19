import { Injectable } from "@nestjs/common";

import { SupabaseService } from "@/infra/supabase/supabase.service";

/** create_group_with_owner / join_group 이 돌려주는 한 행. */
export interface GroupRecord {
  id: string;
  name: string;
  invite_code: string;
  role: string;
  member_count: number;
  created_at: string;
}

/** group_summaries 뷰 한 행(요청자 역할 미포함). */
export interface GroupSummaryRow {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

/** list_my_groups 한 행(요약 + 요청자 역할 + joined_at 커서). */
export interface MyGroupRow extends GroupRecord {
  joined_at: string;
}

/** list_group_members 한 행. */
export interface MemberRow {
  user_id: string;
  display_name: string;
  masked_name: string;
  role: string;
  joined_at: string;
}

@Injectable()
export class GroupsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * 방 생성 + 개설자를 owner 로 등록을, 하나의 Postgres 함수(트랜잭션)로 원자 실행한다.
   * supabase-js 는 다중문 트랜잭션을 지원하지 않으므로 RPC 로 원자성을 확보한다.
   */
  async createGroupWithOwner(
    userId: string,
    name: string,
    keyword: string | null = null,
  ): Promise<GroupRecord> {
    const { data, error } = await this.supabase.client.rpc(
      "create_group_with_owner",
      { p_user_id: userId, p_name: name, p_keyword: keyword },
    );

    if (error) {
      throw error;
    }

    const row = data?.[0];
    if (!row) {
      throw new Error("create_group_with_owner 가 행을 반환하지 않았습니다");
    }

    return row;
  }

  /** 요청자의 방 멤버십(역할). 방-스코프 인가의 근거(RLS 대체). */
  async findMembership(
    groupId: string,
    userId: string,
  ): Promise<{ role: string } | null> {
    const { data, error } = await this.supabase.client
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as { role: string } | null) ?? null;
  }

  /** 방의 각색 키워드(없으면 null). 각색 봉합선이 프롬프트 힌트로 쓴다. */
  async getKeyword(groupId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from("groups")
      .select("keyword")
      .eq("id", groupId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as { keyword: string | null } | null)?.keyword ?? null;
  }

  async getSummary(groupId: string): Promise<GroupSummaryRow | null> {
    const { data, error } = await this.supabase.client
      .from("group_summaries")
      .select("id, name, invite_code, created_by, created_at, member_count")
      .eq("id", groupId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as GroupSummaryRow | null) ?? null;
  }

  async listMyGroups(
    userId: string,
    limit: number,
    before: string | null,
  ): Promise<MyGroupRow[]> {
    const { data, error } = await this.supabase.client.rpc("list_my_groups", {
      p_user_id: userId,
      p_limit: limit,
      p_before: before,
    });

    if (error) {
      throw error;
    }

    return (data as MyGroupRow[] | null) ?? [];
  }

  async rotateInviteCode(groupId: string): Promise<string> {
    const { data, error } = await this.supabase.client.rpc(
      "rotate_invite_code",
      { p_group_id: groupId },
    );

    if (error) {
      throw error;
    }

    return data as string;
  }

  /** 초대 코드로 참여(멱등). 코드가 유효하지 않으면 null. */
  async joinGroup(
    userId: string,
    inviteCode: string,
  ): Promise<GroupRecord | null> {
    const { data, error } = await this.supabase.client.rpc("join_group", {
      p_user_id: userId,
      p_invite_code: inviteCode,
    });

    if (error) {
      throw error;
    }

    return data?.[0] ?? null;
  }

  async updateName(groupId: string, name: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("groups")
      .update({ name })
      .eq("id", groupId);

    if (error) {
      throw error;
    }
  }

  async listMembers(groupId: string): Promise<MemberRow[]> {
    const { data, error } = await this.supabase.client.rpc(
      "list_group_members",
      { p_group_id: groupId },
    );

    if (error) {
      throw error;
    }

    return (data as MemberRow[] | null) ?? [];
  }

  /** 멤버십 삭제. 실제로 삭제된 행이 있으면 true(대상이 비멤버면 false). */
  async deleteMembership(groupId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      throw error;
    }

    return Array.isArray(data) && data.length > 0;
  }
}
