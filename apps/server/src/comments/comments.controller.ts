import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import { PageQueryDto } from "@/common/page-query.dto";

import {
  CommentsService,
  type CommentListResponse,
  type CommentResponse,
} from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Controller()
@UseGuards(JwtUserGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** GET /v1/articles/:articleId/comments — 댓글 목록(오름차순). */
  @Get("articles/:articleId/comments")
  list(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
    @Query() query: PageQueryDto,
  ): Promise<CommentListResponse> {
    return this.comments.list(user.id, articleId, {
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  /** POST /v1/articles/:articleId/comments — 댓글 작성. */
  @Post("articles/:articleId/comments")
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return this.comments.create(user.id, articleId, dto.body);
  }

  /** DELETE /v1/comments/:commentId — 댓글 삭제(작성자 본인). */
  @Delete("comments/:commentId")
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param("commentId") commentId: string,
  ): Promise<void> {
    return this.comments.delete(user.id, commentId);
  }
}
