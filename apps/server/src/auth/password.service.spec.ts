import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("해시는 원문 비밀번호를 담지 않는다", async () => {
    const hash = await service.hash("s3cret-pw");

    expect(hash).not.toContain("s3cret-pw");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("같은 비밀번호라도 매번 다른 해시를 만든다(솔트)", async () => {
    const a = await service.hash("same-pw");
    const b = await service.hash("same-pw");

    expect(a).not.toBe(b);
  });

  it("올바른 비밀번호를 검증하면 true", async () => {
    const hash = await service.hash("correct-horse");

    await expect(service.verify("correct-horse", hash)).resolves.toBe(true);
  });

  it("틀린 비밀번호를 검증하면 false", async () => {
    const hash = await service.hash("correct-horse");

    await expect(service.verify("wrong", hash)).resolves.toBe(false);
  });

  it("형식이 깨진 해시는 false 로 처리한다", async () => {
    await expect(service.verify("x", "not-a-valid-hash")).resolves.toBe(false);
  });
});
