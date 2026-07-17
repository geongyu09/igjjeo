import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import type { AppEnv } from "@/config/env.validation";
import type { Database } from "./database.types";

/**
 * Supabase 를 **DB 전용**으로 사용하는 단일 데이터 접근 진입점 (봉합선).
 *
 * - service_role 키를 쓰므로 RLS 를 우회한다. 방(그룹) 단위 격리는 애플리케이션
 *   인가 계층이 강제한다(RLS 대체, conventions.md §3). 이 클라이언트는 반드시
 *   서버 내부에서만 쓰이며 절대 클라이언트로 노출되지 않는다.
 * - 모든 리포지토리는 이 서비스의 client 를 통해서만 DB 에 접근한다. 나중에
 *   Supabase 를 이탈해 raw Postgres 로 옮길 때 교체 지점을 이 한 파일로 좁힌다.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase!: SupabaseClient<Database>;

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  onModuleInit(): void {
    const url = this.config.get("SUPABASE_URL", { infer: true });
    const serviceRoleKey = this.config.get("SUPABASE_SERVICE_ROLE_KEY", {
      infer: true,
    });

    this.supabase = createClient<Database>(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** 데이터 접근 계층 내부에서만 호출한다. */
  get client(): SupabaseClient<Database> {
    return this.supabase;
  }
}
