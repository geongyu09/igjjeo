import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

/**
 * HTTP 레이어 스모크 테스트. DB 를 건드리지 않는 경로만 검증한다 —
 * 전역 프리픽스(/v1)·ValidationPipe·표준 에러 봉투 필터·인증 가드가
 * 실제 요청 위에서 함께 동작하는지 확인해 DI 배선 오류를 잡는다.
 */
describe("앱 HTTP 스모크 (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    process.env.ANTHROPIC_API_KEY = "test-anthropic";
    process.env.JWT_SECRET = "e2e-test-secret";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test-google-client";
    process.env.APPLE_OAUTH_CLIENT_ID = "test-apple-client";

    const { AppModule } = await import("./app.module");
    const { AllExceptionsFilter } =
      await import("./common/all-exceptions.filter");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /v1/health 는 200 ok 를 반환한다", async () => {
    const res = await request(app.getHttpServer()).get("/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "igjjeo-api" });
  });

  it("토큰 없이 GET /v1/me 는 401 표준 봉투를 반환한다", async () => {
    const res = await request(app.getHttpServer()).get("/v1/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  it("잘못된 body 로 POST /v1/auth/login 은 400 validation_failed 를 반환한다", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_failed");
    expect(res.body.error.details).toBeDefined();
  });

  it("존재하지 않는 경로는 404 표준 봉투를 반환한다", async () => {
    const res = await request(app.getHttpServer()).get("/v1/nope");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });
});
