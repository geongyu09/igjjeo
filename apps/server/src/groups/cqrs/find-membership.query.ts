import { type IQueryHandler, Query, QueryHandler } from "@nestjs/cqrs";

import { GroupsRepository } from "../groups.repository";

/** 방 멤버십(역할). 멤버가 아니면 null. */
export type MembershipResult = { role: string } | null;

/**
 * 요청자가 특정 방의 멤버인지 조회한다(groups 소유). 다른 모듈·가드는
 * GroupsRepository 를 직접 주입하지 않고 이 쿼리를 QueryBus 로 보낸다(RLS 대체 봉합선).
 */
export class FindMembershipQuery extends Query<MembershipResult> {
  constructor(
    readonly groupId: string,
    readonly userId: string,
  ) {
    super();
  }
}

@QueryHandler(FindMembershipQuery)
export class FindMembershipHandler
  implements IQueryHandler<FindMembershipQuery, MembershipResult>
{
  constructor(private readonly groups: GroupsRepository) {}

  execute(query: FindMembershipQuery): Promise<MembershipResult> {
    return this.groups.findMembership(query.groupId, query.userId);
  }
}
