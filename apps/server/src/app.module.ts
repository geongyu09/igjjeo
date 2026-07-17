import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "@/auth/auth.module";
import { validateEnv } from "@/config/env.validation";
import { GroupsModule } from "@/groups/groups.module";
import { HealthModule } from "@/health/health.module";
import { SupabaseModule } from "@/infra/supabase/supabase.module";
import { ProfilesModule } from "@/profiles/profiles.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    SupabaseModule,
    AuthModule,
    ProfilesModule,
    HealthModule,
    GroupsModule,
  ],
})
export class AppModule {}
