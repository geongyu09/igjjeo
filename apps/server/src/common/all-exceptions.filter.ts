import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

import { toErrorResponse } from "./error-response";

/**
 * 모든 예외를 conventions.md §5 표준 에러 봉투로 직렬화하는 전역 필터.
 * main.ts 에서 app.useGlobalFilters 로 등록한다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = toErrorResponse(exception);
    response.status(status).json(body);
  }
}
