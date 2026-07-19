import type { SupabaseService } from "@/infra/supabase/supabase.service";

import {
  AuthRepository,
  EmailAlreadyExistsError,
  OAuthIdentityExistsError,
} from "./auth.repository";

const profileRow = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "김건규",
  masked_name: "김*규",
  avatar_url: null,
  onboarded: true,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeSupabase(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  };
  const from = jest.fn(() => builder);
  const rpc = jest.fn().mockResolvedValue(result);
  return {
    from,
    rpc,
    builder,
    service: { client: { from, rpc } } as unknown as SupabaseService,
  };
}

describe("AuthRepository", () => {
  describe("createAccount", () => {
    const input = {
      email: "kim@example.com",
      passwordHash: "scrypt$aa$bb",
      displayName: "김건규",
      maskedName: "김*규",
    };

    it("create_account RPC 를 인자로 호출하고 프로필 행을 반환한다", async () => {
      const { rpc, service } = makeSupabase({
        data: [profileRow],
        error: null,
      });
      const repo = new AuthRepository(service);

      const result = await repo.createAccount(input);

      expect(rpc).toHaveBeenCalledWith("create_account", {
        p_email: "kim@example.com",
        p_password_hash: "scrypt$aa$bb",
        p_display_name: "김건규",
        p_masked_name: "김*규",
      });
      expect(result).toEqual(profileRow);
    });

    it("이메일 중복(23505)이면 EmailAlreadyExistsError 를 던진다", async () => {
      const { service } = makeSupabase({
        data: null,
        error: { code: "23505", message: "duplicate" },
      });
      const repo = new AuthRepository(service);

      await expect(repo.createAccount(input)).rejects.toBeInstanceOf(
        EmailAlreadyExistsError,
      );
    });

    it("그 밖의 에러는 그대로 던진다", async () => {
      const { service } = makeSupabase({
        data: null,
        error: { code: "XX000", message: "boom" },
      });
      const repo = new AuthRepository(service);

      await expect(repo.createAccount(input)).rejects.not.toBeInstanceOf(
        EmailAlreadyExistsError,
      );
    });
  });

  describe("findProfileByOAuthIdentity", () => {
    it("(provider, subject) 로 연결된 프로필을 반환한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: { profiles: profileRow },
        error: null,
      });
      const repo = new AuthRepository(service);

      const result = await repo.findProfileByOAuthIdentity(
        "google",
        "google-sub-1",
      );

      expect(from).toHaveBeenCalledWith("oauth_identities");
      expect(builder.eq).toHaveBeenCalledWith("provider", "google");
      expect(builder.eq).toHaveBeenCalledWith("subject", "google-sub-1");
      expect(result).toEqual(profileRow);
    });

    it("없으면 null 을 반환한다", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new AuthRepository(service);

      await expect(
        repo.findProfileByOAuthIdentity("google", "none"),
      ).resolves.toBeNull();
    });
  });

  describe("createOAuthAccount", () => {
    const input = {
      provider: "google",
      subject: "google-sub-1",
      email: "kim@example.com",
      displayName: "김건규",
      maskedName: "김*규",
    };

    it("create_oauth_account RPC 를 인자로 호출하고 프로필 행을 반환한다", async () => {
      const { rpc, service } = makeSupabase({
        data: [{ ...profileRow, onboarded: false }],
        error: null,
      });
      const repo = new AuthRepository(service);

      const result = await repo.createOAuthAccount(input);

      expect(rpc).toHaveBeenCalledWith("create_oauth_account", {
        p_provider: "google",
        p_subject: "google-sub-1",
        p_email: "kim@example.com",
        p_display_name: "김건규",
        p_masked_name: "김*규",
      });
      expect(result).toEqual({ ...profileRow, onboarded: false });
    });

    it("(provider, subject) 중복(23505)이면 OAuthIdentityExistsError 를 던진다", async () => {
      const { service } = makeSupabase({
        data: null,
        error: { code: "23505", message: "duplicate" },
      });
      const repo = new AuthRepository(service);

      await expect(repo.createOAuthAccount(input)).rejects.toBeInstanceOf(
        OAuthIdentityExistsError,
      );
    });
  });

  describe("findCredentialByEmail", () => {
    it("email 로 크리덴셜을 조회한다", async () => {
      const cred = { profile_id: profileRow.id, password_hash: "scrypt$a$b" };
      const { from, builder, service } = makeSupabase({
        data: cred,
        error: null,
      });
      const repo = new AuthRepository(service);

      const result = await repo.findCredentialByEmail("kim@example.com");

      expect(from).toHaveBeenCalledWith("auth_credentials");
      expect(builder.eq).toHaveBeenCalledWith("email", "kim@example.com");
      expect(result).toEqual(cred);
    });

    it("없으면 null 을 반환한다", async () => {
      const { service } = makeSupabase({ data: null, error: null });
      const repo = new AuthRepository(service);

      await expect(repo.findCredentialByEmail("x@y.z")).resolves.toBeNull();
    });
  });

  describe("리프레시 토큰", () => {
    it("insertRefreshToken 은 refresh_tokens 에 삽입한다", async () => {
      const { from, builder, service } = makeSupabase({
        data: null,
        error: null,
      });
      const repo = new AuthRepository(service);

      await repo.insertRefreshToken({
        profileId: profileRow.id,
        tokenHash: "hash-1",
        expiresAt: new Date("2026-08-17T00:00:00.000Z"),
      });

      expect(from).toHaveBeenCalledWith("refresh_tokens");
      expect(builder.insert).toHaveBeenCalledWith({
        profile_id: profileRow.id,
        token_hash: "hash-1",
        expires_at: "2026-08-17T00:00:00.000Z",
      });
    });

    it("findRefreshToken 은 token_hash 로 조회한다", async () => {
      const tokenRow = {
        id: "t1",
        profile_id: profileRow.id,
        token_hash: "hash-1",
        expires_at: "2026-08-17T00:00:00.000Z",
        revoked_at: null,
      };
      const { builder, service } = makeSupabase({
        data: tokenRow,
        error: null,
      });
      const repo = new AuthRepository(service);

      const result = await repo.findRefreshToken("hash-1");

      expect(builder.eq).toHaveBeenCalledWith("token_hash", "hash-1");
      expect(result).toEqual(tokenRow);
    });

    it("revokeRefreshToken 은 id 로 revoked_at 을 채운다", async () => {
      const { from, builder, service } = makeSupabase({
        data: null,
        error: null,
      });
      const repo = new AuthRepository(service);

      await repo.revokeRefreshToken("t1");

      expect(from).toHaveBeenCalledWith("refresh_tokens");
      expect(builder.eq).toHaveBeenCalledWith("id", "t1");
      const patch = builder.update.mock.calls[0][0] as { revoked_at: unknown };
      expect(patch.revoked_at).toEqual(expect.any(String));
    });

    it("revokeAllForProfile 은 미폐기 토큰만 폐기한다", async () => {
      const { builder, service } = makeSupabase({ data: null, error: null });
      const repo = new AuthRepository(service);

      await repo.revokeAllForProfile(profileRow.id);

      expect(builder.eq).toHaveBeenCalledWith("profile_id", profileRow.id);
      expect(builder.is).toHaveBeenCalledWith("revoked_at", null);
    });
  });
});
