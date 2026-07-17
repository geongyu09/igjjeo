import { Module } from "@nestjs/common";

import { GroupMembershipGuard } from "@/groups/group-membership.guard";

import { DailyPromptsController } from "./daily-prompts.controller";
import { DailyPromptsRepository } from "./daily-prompts.repository";
import { DailyPromptsService } from "./daily-prompts.service";

/**
 * 데일리 프롬프트(빈 피드 부트스트랩). 답변을 모아 기사로 발행할 때 AI 각색은
 * AdaptContentCommand(CommandBus)로 요청한다 — ReportsModule 을 직접 import 하지 않는다.
 */
@Module({
  controllers: [DailyPromptsController],
  providers: [
    DailyPromptsService,
    DailyPromptsRepository,
    GroupMembershipGuard,
  ],
})
export class DailyPromptsModule {}
