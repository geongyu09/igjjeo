import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

import { toErrorResponse } from "./error-response";

describe("toErrorResponse", () => {
  it("이미 표준 봉투를 담은 예외는 그대로 통과시킨다", () => {
    const ex = new UnauthorizedException({
      error: { code: "token_expired", message: "만료" },
    });

    expect(toErrorResponse(ex)).toEqual({
      status: 401,
      body: { error: { code: "token_expired", message: "만료" } },
    });
  });

  it("ValidationPipe 의 400 배열 메시지를 validation_failed 로 감싼다", () => {
    const ex = new BadRequestException(["email must be an email", "weak pw"]);

    const result = toErrorResponse(ex);
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("validation_failed");
    expect(result.body.error.details).toEqual({
      messages: ["email must be an email", "weak pw"],
    });
  });

  it("문자열 메시지 예외는 상태코드에 맞는 code 로 매핑한다", () => {
    expect(toErrorResponse(new NotFoundException("없음")).body.error.code).toBe(
      "not_found",
    );
    expect(
      toErrorResponse(new ForbiddenException("권한 없음")).body.error.code,
    ).toBe("forbidden");
  });

  it("알 수 없는 오류는 500 internal_error 로 감싸고 내부 정보를 노출하지 않는다", () => {
    const result = toErrorResponse(new Error("DB password is secret123"));

    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("internal_error");
    expect(result.body.error.message).not.toContain("secret123");
  });
});
