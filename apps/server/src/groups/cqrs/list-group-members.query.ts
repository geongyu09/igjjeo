import { type IQueryHandler, Query, QueryHandler } from "@nestjs/cqrs";

import { GroupsRepository } from "../groups.repository";

/** 각색 마스킹에 필요한 방 멤버의 실명·마스킹명 한 쌍. */
export interface GroupMemberName {
  display_name: string;
  masked_name: string;
}

/**
 * 방 멤버의 실명·마스킹명 목록을 조회한다(groups 소유). 각색 어댑터가 원문 속
 * 실명을 마스킹 subjects 로 치환할 때 CommandBus→QueryBus 로 이 쿼리를 보낸다.
 */
export class ListGroupMembersQuery extends Query<GroupMemberName[]> {
  constructor(readonly groupId: string) {
    super();
  }
}

@QueryHandler(ListGroupMembersQuery)
export class ListGroupMembersHandler
  implements IQueryHandler<ListGroupMembersQuery, GroupMemberName[]>
{
  constructor(private readonly groups: GroupsRepository) {}

  async execute(query: ListGroupMembersQuery): Promise<GroupMemberName[]> {
    const members = await this.groups.listMembers(query.groupId);
    return members.map((m) => ({
      display_name: m.display_name,
      masked_name: m.masked_name,
    }));
  }
}
