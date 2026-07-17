import { Module } from "@nestjs/common";

import { ReactionsController } from "./reactions.controller";
import { ReactionsRepository } from "./reactions.repository";
import { ReactionsService } from "./reactions.service";

/** 반응 토글. 기사-스코프 인가는 GetArticleAccessQuery(QueryBus)로 묻는다. */
@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService, ReactionsRepository],
})
export class ReactionsModule {}
