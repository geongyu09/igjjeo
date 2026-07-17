import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";

import { ArticlesModule } from "@/articles/articles.module";
import { AuthModule } from "@/auth/auth.module";
import { CommentsModule } from "@/comments/comments.module";
import { CorrectionsModule } from "@/corrections/corrections.module";
import { validateEnv } from "@/config/env.validation";
import { DailyPromptsModule } from "@/daily-prompts/daily-prompts.module";
import { GroupsModule } from "@/groups/groups.module";
import { HealthModule } from "@/health/health.module";
import { SupabaseModule } from "@/infra/supabase/supabase.module";
import { ProfilesModule } from "@/profiles/profiles.module";
import { ReactionsModule } from "@/reactions/reactions.module";
import { ReportsModule } from "@/reports/reports.module";

/**
 * CqrsModule.forRoot() 는 CommandBus·QueryBus 를 전역 제공하고, 부팅 시 모든 모듈의
 * @CommandHandler·@QueryHandler 를 탐색·등록한다. 도메인 모듈은 서로를 직접 import
 * 하지 않고 이 버스로 커맨드/쿼리를 주고받는다(모듈 간 결합 최소화).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    CqrsModule.forRoot(),
    SupabaseModule,
    AuthModule,
    ProfilesModule,
    HealthModule,
    GroupsModule,
    ReportsModule,
    ArticlesModule,
    ReactionsModule,
    CommentsModule,
    CorrectionsModule,
    DailyPromptsModule,
  ],
})
export class AppModule {}
