import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import {
  CurrentMembership,
  GroupMembershipGuard,
  type Membership,
} from "@/groups/group-membership.guard";
import type { Json } from "@/infra/supabase/database.types";

import {
  DailyPromptsService,
  type PromptResponse,
} from "./daily-prompts.service";
import { AnswerPromptDto } from "./dto/answer-prompt.dto";
import { GetPromptQuery } from "./dto/get-prompt.query";
import { SeedPromptDto } from "./dto/seed-prompt.dto";
import type { PromptRow } from "./daily-prompts.repository";

@Controller("groups/:groupId/daily-prompt")
@UseGuards(JwtUserGuard, GroupMembershipGuard)
export class DailyPromptsController {
  constructor(private readonly prompts: DailyPromptsService) {}

  /** GET /v1/groups/:groupId/daily-prompt — 오늘의 질문. 없으면 204. */
  @Get()
  async getToday(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
    @Query() query: GetPromptQuery,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PromptResponse | undefined> {
    const prompt = await this.prompts.getToday(
      user.id,
      membership.groupId,
      query.date,
    );
    if (!prompt) {
      res.status(204);
      return undefined;
    }
    return prompt;
  }

  /** POST /v1/groups/:groupId/daily-prompts/:promptId/answers — 답변. */
  @Post("s/:promptId/answers")
  @HttpCode(201)
  answer(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
    @Param("promptId") promptId: string,
    @Body() dto: AnswerPromptDto,
  ): Promise<Json> {
    return this.prompts.answer(
      user.id,
      membership.groupId,
      promptId,
      dto.answer_text,
    );
  }

  /** POST /v1/groups/:groupId/daily-prompts/:promptId/publish — 답변을 기사로 발행. */
  @Post("s/:promptId/publish")
  @HttpCode(201)
  publish(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
    @Param("promptId") promptId: string,
  ): Promise<Json> {
    return this.prompts.publish(user.id, membership.groupId, promptId);
  }

  /** POST /v1/groups/:groupId/daily-prompts — 프롬프트 시딩(owner). */
  @Post("s")
  @HttpCode(201)
  seed(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: Membership,
    @Body() dto: SeedPromptDto,
  ): Promise<PromptRow> {
    return this.prompts.seed(
      user.id,
      membership.groupId,
      membership.role,
      dto.question,
      dto.date,
    );
  }
}
