import { type IQueryHandler, Query, QueryHandler } from "@nestjs/cqrs";

import { GroupsRepository } from "../groups.repository";

/** 방의 각색 키워드. 설정돼 있지 않으면 null. */
export type GroupKeywordResult = string | null;

/**
 * 방의 각색 키워드를 조회한다(groups 소유). 각색 봉합선(reports/adaptation)이
 * GroupsRepository 를 직접 주입하는 대신 이 쿼리를 QueryBus 로 보내 프롬프트 힌트로 쓴다.
 */
export class FindGroupKeywordQuery extends Query<GroupKeywordResult> {
  constructor(readonly groupId: string) {
    super();
  }
}

@QueryHandler(FindGroupKeywordQuery)
export class FindGroupKeywordHandler implements IQueryHandler<
  FindGroupKeywordQuery,
  GroupKeywordResult
> {
  constructor(private readonly groups: GroupsRepository) {}

  execute(query: FindGroupKeywordQuery): Promise<GroupKeywordResult> {
    return this.groups.getKeyword(query.groupId);
  }
}
