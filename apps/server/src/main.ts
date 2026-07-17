import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
import { AllExceptionsFilter } from "@/common/all-exceptions.filter";
import type { AppEnv } from "@/config/env.validation";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
