import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import type { Json } from "@/infra/supabase/database.types";

import { ReactionsService } from "./reactions.service";

@Controller("articles/:articleId/reactions")
@UseGuards(JwtUserGuard)
export class ReactionsController {
  constructor(private readonly reactions: ReactionsService) {}

  /** PUT /v1/articles/:articleId/reactions/:reactionType — 반응 누름(멱등). */
  @Put(":reactionType")
  @HttpCode(200)
  add(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
    @Param("reactionType") reactionType: string,
  ): Promise<Json> {
    return this.reactions.add(user.id, articleId, reactionType);
  }

  /** DELETE /v1/articles/:articleId/reactions/:reactionType — 반응 취소(멱등). */
  @Delete(":reactionType")
  @HttpCode(200)
  remove(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
    @Param("reactionType") reactionType: string,
  ): Promise<Json> {
    return this.reactions.remove(user.id, articleId, reactionType);
  }
}
