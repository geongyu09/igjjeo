import { Module } from "@nestjs/common";

import { GroupMembershipGuard } from "@/groups/group-membership.guard";

import { ArticleAccessService } from "./article-access.service";
import { ArticlesController } from "./articles.controller";
import { ArticlesRepository } from "./articles.repository";
import { ArticlesService } from "./articles.service";
import { GetArticleAccessHandler } from "./cqrs/get-article-access.query";

/**
 * 피드·기사 조회. 기사-스코프 인가는 GetArticleAccessQuery 핸들러로 노출한다 —
 * reactions·comments·corrections 는 ArticlesModule 을 import 하지 않고 QueryBus 로 묻는다.
 */
@Module({
  controllers: [ArticlesController],
  providers: [
    ArticlesService,
    ArticlesRepository,
    ArticleAccessService,
    GetArticleAccessHandler,
    GroupMembershipGuard,
  ],
})
export class ArticlesModule {}
