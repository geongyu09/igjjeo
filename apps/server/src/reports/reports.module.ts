import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppEnv } from "@/config/env.validation";
import { GroupMembershipGuard } from "@/groups/group-membership.guard";

import { AdaptContentHandler } from "./adaptation/adapt-content.command";
import { AdaptationService } from "./adaptation/adaptation.service";
import { ADAPTATION_PORT } from "./adaptation/adaptation.types";
import { createChatModel } from "./adaptation/chat-model.factory";
import { CHAT_MODEL_PORT } from "./adaptation/chat-model.port";
import { ModelAdaptationAdapter } from "./adaptation/model-adaptation.adapter";
import { ReportsController } from "./reports.controller";
import { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

/**
 * 제보·각색·발행. AI 각색은 ADAPTATION_PORT 뒤의 어댑터 한 곳에서만 호출한다.
 * 각색 진입점은 AdaptContentCommand 핸들러로 노출해 corrections·daily-prompts 가
 * ReportsModule 을 import 하지 않고 CommandBus 로 각색을 요청한다.
 *
 * 봉합선이 둘로 나뉘어 있다:
 *   ADAPTATION_PORT  — 각색 도메인(프롬프트·재시도·마스킹). 프로바이더와 무관.
 *   CHAT_MODEL_PORT  — AI 프로바이더. AI_PROVIDER 값으로만 결정된다.
 * 프로바이더 교체는 아래 배선이 아니라 환경변수 한 줄로 끝난다.
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
      provide: CHAT_MODEL_PORT,
      useFactory: (config: ConfigService<AppEnv, true>) =>
        createChatModel(config),
      inject: [ConfigService],
    },
    {
      provide: ADAPTATION_PORT,
      useClass: ModelAdaptationAdapter,
    },
  ],
})
export class ReportsModule {}
