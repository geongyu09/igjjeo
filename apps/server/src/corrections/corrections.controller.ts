import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import type { Json } from "@/infra/supabase/database.types";

import {
  CorrectionsService,
  type CorrectionResult,
} from "./corrections.service";
import { CorrectionRequestDto } from "./dto/correction-request.dto";

@Controller("articles/:articleId")
@UseGuards(JwtUserGuard)
export class CorrectionsController {
  constructor(private readonly corrections: CorrectionsService) {}

  /** POST /v1/articles/:articleId/deletion-request — 올린 사람의 기사 내리기(이유 불요, 즉시). */
  @Post("deletion-request")
  @HttpCode(200)
  requestDeletion(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
  ): Promise<Json> {
    return this.corrections.requestDeletion(user.id, articleId);
  }

  /** POST /v1/articles/:articleId/correction-requests — 정정 요청(당사자/제3자 분기). */
  @Post("correction-requests")
  @HttpCode(201)
  requestCorrection(
    @CurrentUser() user: AuthUser,
    @Param("articleId") articleId: string,
    @Body() dto: CorrectionRequestDto,
  ): Promise<CorrectionResult> {
    return this.corrections.requestCorrection(user.id, articleId, {
      isSubject: dto.is_subject,
      correctionText: dto.correction_text,
    });
  }
}
