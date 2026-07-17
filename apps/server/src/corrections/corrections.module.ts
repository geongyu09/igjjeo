import { Module } from "@nestjs/common";

import { CorrectionsController } from "./corrections.controller";
import { CorrectionsRepository } from "./corrections.repository";
import { CorrectionsService } from "./corrections.service";

/**
 * 정정·삭제. 기사-스코프 인가는 GetArticleAccessQuery(QueryBus), AI 각색은
 * AdaptContentCommand(CommandBus)로 요청한다 — 다른 모듈을 직접 import 하지 않는다.
 */
@Module({
  controllers: [CorrectionsController],
  providers: [CorrectionsService, CorrectionsRepository],
})
export class CorrectionsModule {}
