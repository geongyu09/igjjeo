import { ConflictException, UnauthorizedException } from "@nestjs/common";

import type { ProfilesRepository } from "@/profiles/profiles.repository";

import {
  AuthRepository,
  EmailAlreadyExistsError,
  type RefreshTokenRow,
} from "./auth.repository";
import { AuthService } from "./auth.service";
import type { PasswordService } from "./password.service";
import type { TokenService } from "./token.service";

const profileRow = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "김건규",
  masked_name: "김*규",
  avatar_url: null,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeDeps() {
  const authRepo = {
    createAccount: jest.fn().mockResolvedValue(profileRow),
    findCredentialByEmail: jest.fn(),
    insertRefreshToken: jest.fn().mockResolvedValue(undefined),
    findRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    revokeAllForProfile: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuthRepository>;

  const profilesRepo = {
    findById: jest.fn().mockResolvedValue(profileRow),
    update: jest.fn(),
  } as unknown as jest.Mocked<ProfilesRepository>;

  const passwords = {
    hash: jest.fn().mockResolvedValue("scrypt$salt$hash"),
    verify: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<PasswordService>;

  let seq = 0;
  const tokens = {
    signAccessToken: jest.fn(() => ({ token: "access-tok", expiresIn: 900 })),
    generateRefreshToken: jest.fn(() => {
      seq += 1;
      return {
        token: `refresh-${seq}`,
        tokenHash: `hash-${seq}`,
        expiresAt: new Date("2026-08-17T00:00:00.000Z"),
      };
    }),
    hashRefreshToken: jest.fn((t: string) => `hash-of-${t}`),
    verifyAccessToken: jest.fn(),
  } as unknown as jest.Mocked<TokenService>;

  const service = new AuthService(authRepo, profilesRepo, passwords, tokens);
  return { service, authRepo, profilesRepo, passwords, tokens };
}

describe("AuthService", () => {
  describe("signup", () => {
    it("비밀번호 해시·마스킹 파생 후 계정을 만들고 토큰 번들을 반환한다", async () => {
      const { service, authRepo, passwords } = makeDeps();

      const bundle = await service.signup({
        email: "KIM@Example.com ",
        password: "password123",
        displayName: "김건규",
      });

      expect(passwords.hash).toHaveBeenCalledWith("password123");
      expect(authRepo.createAccount).toHaveBeenCalledWith({
        email: "kim@example.com",
        passwordHash: "scrypt$salt$hash",
        displayName: "김건규",
        maskedName: "김*규",
      });
      expect(authRepo.insertRefreshToken).toHaveBeenCalledWith({
        profileId: profileRow.id,
        tokenHash: "hash-1",
        expiresAt: new Date("2026-08-17T00:00:00.000Z"),
      });
      expect(bundle).toEqual({
        profile: profileRow,
        access_token: "access-tok",
        refresh_token: "refresh-1",
        expires_in: 900,
      });
    });

    it("이메일 중복이면 409 conflict 로 변환한다", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.createAccount as jest.Mock).mockRejectedValue(
        new EmailAlreadyExistsError(),
      );

      await expect(
        service.signup({
          email: "dup@example.com",
          password: "password123",
          displayName: "홍길동",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("자격이 맞으면 토큰 번들을 반환한다", async () => {
      const { service, authRepo, passwords } = makeDeps();
      (authRepo.findCredentialByEmail as jest.Mock).mockResolvedValue({
        profile_id: profileRow.id,
        password_hash: "scrypt$salt$hash",
      });

      const bundle = await service.login({
        email: "Kim@example.com",
        password: "password123",
      });

      expect(authRepo.findCredentialByEmail).toHaveBeenCalledWith(
        "kim@example.com",
      );
      expect(passwords.verify).toHaveBeenCalledWith(
        "password123",
        "scrypt$salt$hash",
      );
      expect(bundle.access_token).toBe("access-tok");
      expect(bundle.profile).toEqual(profileRow);
    });

    it("이메일이 없으면 401(존재 여부 비노출)", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.findCredentialByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: "none@example.com", password: "x" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("비밀번호가 틀리면 401", async () => {
      const { service, authRepo, passwords } = makeDeps();
      (authRepo.findCredentialByEmail as jest.Mock).mockResolvedValue({
        profile_id: profileRow.id,
        password_hash: "scrypt$salt$hash",
      });
      (passwords.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "kim@example.com", password: "wrong" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("refresh", () => {
    const liveToken: RefreshTokenRow = {
      id: "rt-1",
      profile_id: profileRow.id,
      token_hash: "hash-of-refresh-abc",
      expires_at: "2999-01-01T00:00:00.000Z",
      revoked_at: null,
    };

    it("유효하면 기존 토큰을 폐기하고 새 토큰 쌍을 발급한다(회전)", async () => {
      const { service, authRepo, tokens } = makeDeps();
      (authRepo.findRefreshToken as jest.Mock).mockResolvedValue(liveToken);

      const bundle = await service.refresh("refresh-abc");

      expect(tokens.hashRefreshToken).toHaveBeenCalledWith("refresh-abc");
      expect(authRepo.revokeRefreshToken).toHaveBeenCalledWith("rt-1");
      expect(authRepo.insertRefreshToken).toHaveBeenCalled();
      expect(bundle).toEqual({
        access_token: "access-tok",
        refresh_token: "refresh-1",
        expires_in: 900,
      });
    });

    it("이미 폐기된 토큰이면 재사용으로 보고 세션 전체를 폐기하고 401", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.findRefreshToken as jest.Mock).mockResolvedValue({
        ...liveToken,
        revoked_at: "2026-07-17T00:00:00.000Z",
      });

      await expect(service.refresh("refresh-abc")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(authRepo.revokeAllForProfile).toHaveBeenCalledWith(profileRow.id);
    });

    it("만료된 토큰이면 401", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.findRefreshToken as jest.Mock).mockResolvedValue({
        ...liveToken,
        expires_at: "2000-01-01T00:00:00.000Z",
      });

      await expect(service.refresh("refresh-abc")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("존재하지 않는 토큰이면 401", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.findRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(service.refresh("nope")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe("logout", () => {
    it("본인 소유의 리프레시 토큰을 폐기한다", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.findRefreshToken as jest.Mock).mockResolvedValue({
        id: "rt-1",
        profile_id: profileRow.id,
        token_hash: "hash-of-refresh-abc",
        expires_at: "2999-01-01T00:00:00.000Z",
        revoked_at: null,
      });

      await service.logout(profileRow.id, "refresh-abc");

      expect(authRepo.revokeRefreshToken).toHaveBeenCalledWith("rt-1");
    });

    it("남의 토큰이면 폐기하지 않는다(멱등적으로 무시)", async () => {
      const { service, authRepo } = makeDeps();
      (authRepo.findRefreshToken as jest.Mock).mockResolvedValue({
        id: "rt-1",
        profile_id: "someone-else",
        token_hash: "h",
        expires_at: "2999-01-01T00:00:00.000Z",
        revoked_at: null,
      });

      await service.logout(profileRow.id, "refresh-abc");

      expect(authRepo.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });
});
