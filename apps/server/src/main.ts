import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
import { AllExceptionsFilter } from "@/common/all-exceptions.filter";
import { isOriginAllowed, parseAllowedOrigins } from "@/common/cors-origin";
import type { AppEnv } from "@/config/env.validation";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppEnv, true>>(ConfigService);

  // 웹(apps/web)이 다른 오리진(브라우저 :3000, 실기기 WebView LAN IP)에서 호출하므로 CORS 허용.
  // 허용 목록에 없는 오리진은 막는다 — 요청 오리진을 그대로 반사하지 않는다.
  // 로컬 개발(NODE_ENV !== production)에서는 매번 바뀌는 LAN IP 를 목록 없이 허용한다.
  const originPolicy = {
    allowList: parseAllowedOrigins(
      config.get("CORS_ALLOWED_ORIGINS", { infer: true }),
    ),
    allowLocalNetwork: config.get("NODE_ENV", { infer: true }) !== "production",
  };
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => callback(null, isOriginAllowed(origin, originPolicy)),
    credentials: false,
  });

  // 모든 경로에 /v1 프리픽스 (conventions.md §1)
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 모든 에러를 표준 봉투로 직렬화 (conventions.md §5)
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get("API_PORT", { infer: true });

  await app.listen(port);
}

void bootstrap();
