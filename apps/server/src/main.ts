import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
import { AllExceptionsFilter } from "@/common/all-exceptions.filter";
import type { AppEnv } from "@/config/env.validation";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // 웹(apps/web)이 다른 오리진(브라우저 :3000, 실기기 WebView LAN IP)에서 호출하므로 CORS 허용.
  // 인증은 Authorization Bearer 토큰이라 쿠키 자격증명이 없어, 요청 오리진 반영으로 충분하다.
  app.enableCors({ origin: true, credentials: false });

  // 모든 경로에 /v1 프리픽스 (conventions.md §1)
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 모든 에러를 표준 봉투로 직렬화 (conventions.md §5)
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = app.get<ConfigService<AppEnv, true>>(ConfigService);
  const port = config.get("API_PORT", { infer: true });

  await app.listen(port);
}

void bootstrap();
