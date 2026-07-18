import { Module } from "@nestjs/common";

import { GroupMembershipGuard } from "@/groups/group-membership.guard";

import { MeController } from "./me.controller";
import { MemberProfileController } from "./member-profile.controller";
import { ProfilesRepository } from "./profiles.repository";
import { ProfilesService } from "./profiles.service";

@Module({
  controllers: [MeController, MemberProfileController],
  providers: [ProfilesService, ProfilesRepository, GroupMembershipGuard],
  exports: [ProfilesService, ProfilesRepository],
})
export class ProfilesModule {}
