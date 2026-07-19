import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

// "jose" 는 package.json jest.moduleNameMapper 로 test/jose.mock.ts 로 치환된다
// (jose v6 는 ESM 전용이라 ts-jest 스위트에서 직접 로드 불가). 그 목의 jwtVerify 를 제어한다.
import { jwtVerify } from "jose";

import type { AppEnv } from "@/config/env.validation";

import { OAuthVerifierService } from "./oauth-verifier.service";

const jwtVerifyMock = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

function makeService() {
  const config = {
    get: jest.fn((key: string) =>
      key === "GOOGLE_OAUTH_CLIENT_ID" ? "google-aud" : "apple-aud",
    ),
  } as unknown as ConfigService<AppEnv, true>;
  return new OAuthVerifierService(config);
}

describe("OAuthVerifierService", () => {
  beforeEach(() => jwtVerifyMock.mockReset());

  it("google id_token 을 검증해 신원(sub·email·name)을 반환한다", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "google-sub-1",
        email: "kim@example.com",
        name: "김건규",
      },
    } as never);

    const service = makeService();
    const identity = await service.verify("google", "tok");

    expect(identity).toEqual({
      subject: "google-sub-1",
      email: "kim@example.com",
      name: "김건규",
    });
    // google 발급자·audience 로 검증했는지 확인
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      "tok",
      expect.anything(),
      expect.objectContaining({
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: "google-aud",
      }),
    );
  });

  it("apple 은 apple audience 로 검증한다", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: { sub: "apple-sub-1" },
    } as never);

    const service = makeService();
    const identity = await service.verify("apple", "tok");

    expect(identity).toEqual({ subject: "apple-sub-1" });
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      "tok",
      expect.anything(),
      expect.objectContaining({
        issuer: ["https://appleid.apple.com"],
        audience: "apple-aud",
      }),
    );
  });

  it("서명·검증 실패 시 401", async () => {
    jwtVerifyMock.mockRejectedValue(new Error("bad signature"));

    const service = makeService();
    await expect(service.verify("google", "tok")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("sub 가 없으면 401", async () => {
    jwtVerifyMock.mockResolvedValue({ payload: {} } as never);

    const service = makeService();
    await expect(service.verify("google", "tok")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
