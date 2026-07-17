import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";

import { CreateGroupDto } from "./dto/create-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";
import { ListGroupsQuery } from "./dto/list-groups.query";
import { RenameGroupDto } from "./dto/rename-group.dto";
import {
  CurrentMembership,
  GroupMembershipGuard,
  type Membership,
} from "./group-membership.guard";
import {
  GroupsService,
  type GroupListResponse,
  type GroupResponse,
} from "./groups.service";

@Controller("groups")
@UseGuards(JwtUserGuard)
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  /** POST /v1/groups — 방 생성(트랜잭션): 개설자를 owner 로 함께 등록한다. */
  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupResponse> {
    return this.groups.createGroup(user.id, dto.name);
  }

  /** GET /v1/groups — 내가 속한 방 목록(커서 페이지네이션). */
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListGroupsQuery,
  ): Promise<GroupListResponse> {
    return this.groups.listMyGroups(user.id, {
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  /** POST /v1/groups/join — 초대 코드로 참여(멱등). */
  @Post("join")
  @HttpCode(200)
  join(
    @CurrentUser() user: AuthUser,
    @Body() dto: JoinGroupDto,
  ): Promise<GroupResponse> {
    return this.groups.join(user.id, dto.invite_code);
  }

  /** GET /v1/groups/:groupId — 방 상세(멤버십 필요). */
  @Get(":groupId")
  @UseGuards(GroupMembershipGuard)
  getOne(@CurrentMembership() membership: Membership): Promise<GroupResponse> {
    return this.groups.getGroup(membership.groupId, membership.role);
  }

  /** PATCH /v1/groups/:groupId — 방 이름 변경(owner). */
  @Patch(":groupId")
  @UseGuards(GroupMembershipGuard)
  rename(
    @CurrentMembership() membership: Membership,
    @Body() dto: RenameGroupDto,
  ): Promise<GroupResponse> {
    return this.groups.rename(membership.groupId, membership.role, dto.name);
  }

  /** POST /v1/groups/:groupId/invite-code/rotate — 초대 코드 재발급(owner). */
  @Post(":groupId/invite-code/rotate")
  @HttpCode(200)
  @UseGuards(GroupMembershipGuard)
  rotate(
    @CurrentMembership() membership: Membership,
  ): Promise<{ invite_code: string }> {
    return this.groups.rotateInvite(membership.groupId, membership.role);
  }

  /** GET /v1/groups/:groupId/members — 멤버 목록(멤버십 필요). */
  @Get(":groupId/members")
  @UseGuards(GroupMembershipGuard)
  members(@CurrentMembership() membership: Membership) {
    return this.groups.listMembers(membership.groupId);
  }

  /** DELETE /v1/groups/:groupId/members/:userId — 나가기(본인) 또는 강퇴(owner). */
  @Delete(":groupId/members/:userId")
  @HttpCode(204)
  @UseGuards(GroupMembershipGuard)
  removeMember(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.groups.removeMember(
      membership.groupId,
      user.id,
      membership.role,
      userId,
    );
  }
}
