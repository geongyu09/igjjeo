import { Controller, Get } from "@nestjs/common";

/**
 * 부팅·라우팅 확인용 헬스 체크. 외부 의존성(DB 등)에 접근하지 않아
 * 프로세스 자체의 생존만 보고한다. DB 준비 상태는 별도 readiness 로 분리 예정.
 */
@Controller("health")
export class HealthController {
  @Get()
  check(): { status: "ok"; service: "igjjeo-api" } {
    return { status: "ok", service: "igjjeo-api" };
  }
}
