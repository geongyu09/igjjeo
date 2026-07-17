import { NotFoundException } from "@nestjs/common";

import { ProfilesRepository } from "./profiles.repository";
import { ProfilesService } from "./profiles.service";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "김건규",
  masked_name: "김*규",
  avatar_url: null,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeService() {
  const repo = {
    findById: jest.fn().mockResolvedValue(row),
    update: jest
      .fn()
      .mockImplementation((_id, patch) =>
        Promise.resolve({ ...row, ...patch }),
      ),
  } as unknown as jest.Mocked<ProfilesRepository>;
  return { service: new ProfilesService(repo), repo };
}

describe("ProfilesService", () => {
  describe("getMe", () => {
    it("내 프로필을 반환한다", async () => {
      const { service } = makeService();
      await expect(service.getMe(row.id)).resolves.toEqual(row);
    });

    it("프로필이 없으면 404", async () => {
      const { service, repo } = makeService();
      (repo.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getMe("gone")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("updateMe", () => {
    it("display_name 변경 시 masked_name 을 재계산해 함께 저장한다", async () => {
      const { service, repo } = makeService();

      const result = await service.updateMe(row.id, {
        display_name: "남궁민수",
      });

      expect(repo.update).toHaveBeenCalledWith(row.id, {
        display_name: "남궁민수",
        masked_name: "남**수",
      });
      expect(result.masked_name).toBe("남**수");
    });

    it("avatar_url 만 바꿀 때는 masked_name 을 건드리지 않는다", async () => {
      const { service, repo } = makeService();

      await service.updateMe(row.id, { avatar_url: "https://x/a.png" });

      expect(repo.update).toHaveBeenCalledWith(row.id, {
        avatar_url: "https://x/a.png",
      });
    });

    it("변경할 필드가 없으면 현재 프로필을 그대로 반환한다(쓰기 없음)", async () => {
      const { service, repo } = makeService();

      const result = await service.updateMe(row.id, {});

      expect(repo.update).not.toHaveBeenCalled();
      expect(result).toEqual(row);
    });
  });
});
