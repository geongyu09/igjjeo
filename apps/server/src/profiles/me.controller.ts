import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";

import { UpdateMeDto } from "./dto/update-me.dto";
import { ProfilesService } from "./profiles.service";
import type { ProfileResponse } from "./profile.response";

@Controller("me")
@UseGuards(JwtUserGuard)
export class MeController {
  constructor(private readonly profiles: ProfilesService) {}

  /** GET /v1/me — 내 프로필. */
  @Get()
  getMe(@CurrentUser() user: AuthUser): Promise<ProfileResponse> {
    return this.profiles.getMe(user.id);
  }

  /** PATCH /v1/me — 표시 이름·아바타 부분 수정(display_name 변경 시 masked_name 재계산). */
  @Patch()
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMeDto,
  ): Promise<ProfileResponse> {
    return this.profiles.updateMe(user.id, dto);
  }
}
