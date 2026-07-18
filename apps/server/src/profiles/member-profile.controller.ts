import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import {
  CurrentMembership,
  GroupMembershipGuard,
  type Membership,
} from "@/groups/group-membership.guard";

import { ProfilesService, type MemberProfileSummary } from "./profiles.service";

@Controller()
@UseGuards(JwtUserGuard)
export class MemberProfileController {
  constructor(private readonly profiles: ProfilesService) {}

  /**
   * GET /v1/groups/:groupId/me/profile — 방 안에서의 내 프로필 요약
   * (통계 + 내가 낸 제보 목록). 방-스코프이므로 멤버십을 검사한다.
   */
  @Get("groups/:groupId/me/profile")
  @UseGuards(GroupMembershipGuard)
  getProfileSummary(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
  ): Promise<MemberProfileSummary> {
    return this.profiles.getMemberProfileSummary(user.id, membership.groupId);
  }
}
