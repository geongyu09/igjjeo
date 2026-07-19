import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser, type AuthUser } from "@/auth/current-user.decorator";
import { JwtUserGuard } from "@/auth/jwt-user.guard";
import { GroupMembershipGuard } from "@/groups/group-membership.guard";

import { CreateReportDto } from "./dto/create-report.dto";
import { PublishReportDto } from "./dto/publish-report.dto";
import { RegenerateReportDto } from "./dto/regenerate-report.dto";
import {
  ReportsService,
  type ArticleResponse,
  type ReportDraftResponse,
  type ReportQuotaResponse,
} from "./reports.service";

@Controller()
@UseGuards(JwtUserGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** POST /v1/groups/:groupId/reports — 제보 생성 + 각색 → 초안 반환. */
  @Post("groups/:groupId/reports")
  @HttpCode(201)
  @UseGuards(GroupMembershipGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Param("groupId") groupId: string,
    @Body() dto: CreateReportDto,
  ): Promise<ReportDraftResponse> {
    return this.reports.createReport(user.id, groupId, {
      rawText: dto.raw_text,
      photoUrl: dto.photo_url ?? null,
      outletKeys: dto.outlet_keys,
      isSelfReport: dto.is_self_report,
    });
  }

  /** GET /v1/me/report-quota — 오늘 제보 한도 사용 현황(사용자 전역). */
  @Get("me/report-quota")
  getReportQuota(@CurrentUser() user: AuthUser): Promise<ReportQuotaResponse> {
    return this.reports.getReportQuota(user.id);
  }

  /** POST /v1/me/report-quota/refill — 오늘 제보 한도를 충전(즉시 전량 회복). */
  @Post("me/report-quota/refill")
  @HttpCode(200)
  refillReportQuota(
    @CurrentUser() user: AuthUser,
  ): Promise<ReportQuotaResponse> {
    return this.reports.refillReportQuota(user.id);
  }

  /** POST /v1/reports/:reportId/regenerate — 초안 재생성(제보자 본인). */
  @Post("reports/:reportId/regenerate")
  @HttpCode(200)
  regenerate(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: RegenerateReportDto,
  ): Promise<ReportDraftResponse> {
    return this.reports.regenerate(user.id, reportId, dto.outlet_keys);
  }

  /** POST /v1/reports/:reportId/publish — 선택 초안을 기사로 발행(제보자 본인). */
  @Post("reports/:reportId/publish")
  @HttpCode(201)
  publish(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: PublishReportDto,
  ): Promise<{ articles: ArticleResponse[] }> {
    return this.reports.publish(user.id, reportId, dto.outlet_keys);
  }

  /** GET /v1/reports/:reportId — 미발행 제보의 현재 초안 재조회(제보자 본인). */
  @Get("reports/:reportId")
  getOne(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
  ): Promise<ReportDraftResponse> {
    return this.reports.getReport(user.id, reportId);
  }
}
