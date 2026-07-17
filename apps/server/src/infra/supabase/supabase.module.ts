import { Global, Module } from "@nestjs/common";

import { SupabaseService } from "./supabase.service";

/**
 * DB 접근 진입점을 전역으로 제공한다. 도메인 모듈들은 이 서비스를 주입받아
 * 리포지토리를 구성한다(직접 createClient 금지 — 봉합선 유지).
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
