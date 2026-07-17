import { Module } from "@nestjs/common";

import { CommentsController } from "./comments.controller";
import { CommentsRepository } from "./comments.repository";
import { CommentsService } from "./comments.service";

/** 댓글. 기사-스코프 인가는 GetArticleAccessQuery(QueryBus)로 묻는다. */
@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
