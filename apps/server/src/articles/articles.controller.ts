import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import { PageQueryDto } from "@/common/page-query.dto";
import {
  CurrentMembership,
  GroupMembershipGuard,
  type Membership,
} from "@/groups/group-membership.guard";
import type { Json } from "@/infra/supabase/database.types";

import {
  ArticlesService,
  type CorrectionSummary,
  type FeedResponse,
} from "./articles.service";

@Controller()
@UseGuards(JwtUserGuard)
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  /** GET /v1/groups/:groupId/feed — 방 피드(제보 묶음 최신순). */
  @Get("groups/:groupId/feed")
  @UseGuards(GroupMembershipGuard)
  feed(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
    @Query() query: PageQueryDto,
  ): Promise<FeedResponse> {
    return this.articles.getFeed(user.id, membership.groupId, {
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  /** GET /v1/articles/:articleId — 기사 상세(정정 연쇄 포함). */
  @Get("articles/:articleId")
  getOne(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
  ): Promise<Json> {
    return this.articles.getArticle(user.id, articleId);
  }

  /** GET /v1/articles/:articleId/corrections — 최초 기사부터의 정정 연쇄 전체. */
  @Get("articles/:articleId/corrections")
  corrections(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
  ): Promise<{ items: CorrectionSummary[] }> {
    return this.articles.listCorrections(user.id, articleId);
  }
}
