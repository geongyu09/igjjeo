import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";
import { GroupMembershipGuard } from "@/groups/group-membership.guard";

import { AdaptContentHandler } from "./adaptation/adapt-content.command";
import { AdaptationService } from "./adaptation/adaptation.service";
import { ADAPTATION_PORT } from "./adaptation/adaptation.types";
import { AnthropicAdaptationAdapter } from "./adaptation/anthropic-adaptation.adapter";
import { ReportsController } from "./reports.controller";
import { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

/**
 * 제보·각색·발행. AI 각색은 ADAPTATION_PORT 뒤의 어댑터 한 곳에서만 호출한다.
 * 각색 진입점은 AdaptContentCommand 핸들러로 노출해 corrections·daily-prompts 가
 * ReportsModule 을 import 하지 않고 CommandBus 로 각색을 요청한다.
 */
@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsRepository,
    AdaptationService,
    AdaptContentHandler,
    GroupMembershipGuard,
    {
      provide: ADAPTATION_PORT,
      useFactory: (config: ConfigService<AppEnv, true>) =>
        new AnthropicAdaptationAdapter(config),
      inject: [ConfigService],
    },
  ],
})
export class ReportsModule {}
