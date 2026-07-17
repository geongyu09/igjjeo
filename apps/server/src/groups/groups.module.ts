import { Module } from "@nestjs/common";

import { FindMembershipHandler } from "./cqrs/find-membership.query";
import { ListGroupMembersHandler } from "./cqrs/list-group-members.query";
import { GroupMembershipGuard } from "./group-membership.guard";
import { GroupsController } from "./groups.controller";
import { GroupsRepository } from "./groups.repository";
import { GroupsService } from "./groups.service";

/**
 * 방·멤버십. 방 멤버십/멤버 목록은 다른 모듈이 GroupsRepository 를 직접 주입하는 대신
 * FindMembershipQuery·ListGroupMembersQuery 로 조회한다(핸들러가 이 모듈에 산다).
 */
@Module({
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupsRepository,
    GroupMembershipGuard,
    FindMembershipHandler,
    ListGroupMembersHandler,
  ],
})
export class GroupsModule {}
