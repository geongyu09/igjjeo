import { ForbiddenException, NotFoundException } from "@nestjs/common";

import type { GroupsRepository } from "./groups.repository";
import { GroupsService } from "./groups.service";

const record = {
  id: "g1",
  name: "부트캠프 3조",
  invite_code: "AB12CD",
  role: "owner",
  member_count: 1,
  created_at: "2026-07-17T00:00:00.000Z",
};

function makeService() {
  const repo = {
    createGroupWithOwner: jest.fn(),
    findMembership: jest.fn(),
    getSummary: jest.fn(),
    getKeyword: jest.fn().mockResolvedValue(null),
    listMyGroups: jest.fn(),
    rotateInviteCode: jest.fn(),
    joinGroup: jest.fn(),
    updateName: jest.fn().mockResolvedValue(undefined),
    updateKeyword: jest.fn().mockResolvedValue(undefined),
    listMembers: jest.fn(),
    deleteMembership: jest.fn(),
  } as unknown as jest.Mocked<GroupsRepository>;
  return { service: new GroupsService(repo), repo };
}

describe("GroupsService", () => {
  describe("createGroup", () => {
    it("이름·키워드를 리포지토리에 넘기고 결과를 Group 응답으로 매핑한다", async () => {
      const { service, repo } = makeService();
      (repo.createGroupWithOwner as jest.Mock).mockResolvedValue(record);

      const result = await service.createGroup(
        "user-1",
        "부트캠프 3조",
        "지각 대장들",
      );

      expect(repo.createGroupWithOwner).toHaveBeenCalledWith(
        "user-1",
        "부트캠프 3조",
        "지각 대장들",
      );
      expect(result).toEqual(record);
    });

    it("키워드가 없으면 null 로 넘긴다", async () => {
      const { service, repo } = makeService();
      (repo.createGroupWithOwner as jest.Mock).mockResolvedValue(record);

      await service.createGroup("user-1", "부트캠프 3조");

      expect(repo.createGroupWithOwner).toHaveBeenCalledWith(
        "user-1",
        "부트캠프 3조",
        null,
      );
    });
  });

  describe("listMyGroups", () => {
    it("limit+1 로 조회해 다음 커서를 계산한다", async () => {
      const rows = [
        { ...record, id: "g2", joined_at: "2026-07-17T02:00:00.000Z" },
        { ...record, id: "g1", joined_at: "2026-07-17T01:00:00.000Z" },
        { ...record, id: "g0", joined_at: "2026-07-17T00:00:00.000Z" },
      ];
      const { service, repo } = makeService();
      (repo.listMyGroups as jest.Mock).mockResolvedValue(rows);

      const result = await service.listMyGroups("u1", {
        limit: 2,
        cursor: undefined,
      });

      expect(repo.listMyGroups).toHaveBeenCalledWith("u1", 3, null);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe("g2");
      expect(
        (result.items[0] as unknown as Record<string, unknown>).joined_at,
      ).toBeUndefined();
      expect(result.next_cursor).not.toBeNull();
    });

    it("다음 페이지가 없으면 next_cursor 는 null", async () => {
      const { service, repo } = makeService();
      (repo.listMyGroups as jest.Mock).mockResolvedValue([
        { ...record, joined_at: "2026-07-17T00:00:00.000Z" },
      ]);

      const result = await service.listMyGroups("u1", { limit: 20 });

      expect(result.next_cursor).toBeNull();
    });
  });

  describe("getGroup", () => {
    it("요약 + 역할 + 키워드로 Group 응답을 만든다", async () => {
      const { service, repo } = makeService();
      (repo.getSummary as jest.Mock).mockResolvedValue({
        id: "g1",
        name: "부트캠프 3조",
        invite_code: "AB12CD",
        created_by: "u1",
        created_at: record.created_at,
        member_count: 5,
      });
      (repo.getKeyword as jest.Mock).mockResolvedValue("지각 대장들");

      const result = await service.getGroup("g1", "member");

      expect(result).toEqual({
        ...record,
        role: "member",
        member_count: 5,
        keyword: "지각 대장들",
      });
    });

    it("키워드가 없으면 keyword 는 null", async () => {
      const { service, repo } = makeService();
      (repo.getSummary as jest.Mock).mockResolvedValue({
        id: "g1",
        name: "부트캠프 3조",
        invite_code: "AB12CD",
        created_by: "u1",
        created_at: record.created_at,
        member_count: 1,
      });
      (repo.getKeyword as jest.Mock).mockResolvedValue(null);

      const result = await service.getGroup("g1", "owner");

      expect(result.keyword).toBeNull();
    });

    it("요약이 없으면 404", async () => {
      const { service, repo } = makeService();
      (repo.getSummary as jest.Mock).mockResolvedValue(null);

      await expect(service.getGroup("g1", "owner")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    function mockSummary(repo: jest.Mocked<GroupsRepository>, name: string) {
      (repo.getSummary as jest.Mock).mockResolvedValue({
        id: "g1",
        name,
        invite_code: "AB12CD",
        created_by: "u1",
        created_at: record.created_at,
        member_count: 1,
      });
    }

    it("owner 는 이름만 바꾼다(키워드는 건드리지 않음)", async () => {
      const { service, repo } = makeService();
      mockSummary(repo, "새 이름");

      const result = await service.update("g1", "owner", { name: "새 이름" });

      expect(repo.updateName).toHaveBeenCalledWith("g1", "새 이름");
      expect(repo.updateKeyword).not.toHaveBeenCalled();
      expect(result.name).toBe("새 이름");
    });

    it("owner 는 키워드만 바꾼다(이름은 건드리지 않음)", async () => {
      const { service, repo } = makeService();
      mockSummary(repo, "부트캠프 3조");

      await service.update("g1", "owner", { keyword: "밤샘 코딩" });

      expect(repo.updateKeyword).toHaveBeenCalledWith("g1", "밤샘 코딩");
      expect(repo.updateName).not.toHaveBeenCalled();
    });

    it("빈(공백) 키워드는 null 로 지운다", async () => {
      const { service, repo } = makeService();
      mockSummary(repo, "부트캠프 3조");

      await service.update("g1", "owner", { keyword: "   " });

      expect(repo.updateKeyword).toHaveBeenCalledWith("g1", null);
    });

    it("owner 가 아니면 403 이고 아무것도 갱신하지 않는다", async () => {
      const { service, repo } = makeService();

      await expect(
        service.update("g1", "member", { name: "새 이름" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateName).not.toHaveBeenCalled();
      expect(repo.updateKeyword).not.toHaveBeenCalled();
    });
  });

  describe("rotateInvite", () => {
    it("owner 는 새 초대 코드를 받는다", async () => {
      const { service, repo } = makeService();
      (repo.rotateInviteCode as jest.Mock).mockResolvedValue("ZZ99ZZ");

      await expect(service.rotateInvite("g1", "owner")).resolves.toEqual({
        invite_code: "ZZ99ZZ",
      });
    });

    it("owner 가 아니면 403", async () => {
      const { service } = makeService();
      await expect(service.rotateInvite("g1", "member")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("join", () => {
    it("유효한 코드면 참여한 Group 을 반환한다", async () => {
      const { service, repo } = makeService();
      (repo.joinGroup as jest.Mock).mockResolvedValue({
        ...record,
        role: "member",
      });

      const result = await service.join("u1", "AB12CD");
      expect(result.role).toBe("member");
    });

    it("코드가 유효하지 않으면 404(존재 은닉)", async () => {
      const { service, repo } = makeService();
      (repo.joinGroup as jest.Mock).mockResolvedValue(null);

      await expect(service.join("u1", "NOPE")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("removeMember", () => {
    it("본인은 스스로 방을 나갈 수 있다", async () => {
      const { service, repo } = makeService();
      (repo.deleteMembership as jest.Mock).mockResolvedValue(true);

      await service.removeMember("g1", "u1", "member", "u1");

      expect(repo.deleteMembership).toHaveBeenCalledWith("g1", "u1");
    });

    it("owner 는 다른 멤버를 강퇴할 수 있다", async () => {
      const { service, repo } = makeService();
      (repo.deleteMembership as jest.Mock).mockResolvedValue(true);

      await service.removeMember("g1", "owner-id", "owner", "u2");

      expect(repo.deleteMembership).toHaveBeenCalledWith("g1", "u2");
    });

    it("owner 가 아닌 사람이 남을 강퇴하려 하면 403", async () => {
      const { service, repo } = makeService();

      await expect(
        service.removeMember("g1", "u1", "member", "u2"),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.deleteMembership).not.toHaveBeenCalled();
    });

    it("대상이 비멤버면 404", async () => {
      const { service, repo } = makeService();
      (repo.deleteMembership as jest.Mock).mockResolvedValue(false);

      await expect(
        service.removeMember("g1", "owner-id", "owner", "ghost"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("listMembers", () => {
    it("멤버 목록을 items 봉투로 반환한다", async () => {
      const members = [
        {
          user_id: "u1",
          display_name: "김건규",
          masked_name: "김*규",
          role: "owner",
          joined_at: record.created_at,
        },
      ];
      const { service, repo } = makeService();
      (repo.listMembers as jest.Mock).mockResolvedValue(members);

      await expect(service.listMembers("g1")).resolves.toEqual({
        items: members,
      });
    });
  });
});
