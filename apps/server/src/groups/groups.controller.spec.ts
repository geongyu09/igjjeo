import type { GroupsService } from "./groups.service";

import { GroupsController } from "./groups.controller";

function makeController() {
  const service = {
    createGroup: jest.fn(),
    listMyGroups: jest.fn(),
    join: jest.fn(),
    getGroup: jest.fn(),
    rename: jest.fn(),
    rotateInvite: jest.fn(),
    listMembers: jest.fn(),
    removeMember: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<GroupsService>;
  return { controller: new GroupsController(service), service };
}

describe("GroupsController", () => {
  it("create 는 요청자 id 와 name 으로 방을 생성한다", async () => {
    const { controller, service } = makeController();
    const group = { id: "g1" } as never;
    (service.createGroup as jest.Mock).mockResolvedValue(group);

    const result = await controller.create(
      { id: "user-1" },
      { name: "부트캠프 3조" },
    );

    expect(service.createGroup).toHaveBeenCalledWith("user-1", "부트캠프 3조");
    expect(result).toBe(group);
  });

  it("list 는 limit·cursor 를 서비스로 전달한다", async () => {
    const { controller, service } = makeController();
    await controller.list({ id: "u1" }, { limit: 10, cursor: "cur" });

    expect(service.listMyGroups).toHaveBeenCalledWith("u1", {
      limit: 10,
      cursor: "cur",
    });
  });

  it("join 은 invite_code 로 참여한다", async () => {
    const { controller, service } = makeController();
    await controller.join({ id: "u1" }, { invite_code: "AB12CD" });

    expect(service.join).toHaveBeenCalledWith("u1", "AB12CD");
  });

  it("getOne 은 멤버십의 groupId·role 로 상세를 조회한다", async () => {
    const { controller, service } = makeController();
    await controller.getOne({ groupId: "g1", role: "member" });

    expect(service.getGroup).toHaveBeenCalledWith("g1", "member");
  });

  it("rename 은 멤버십 역할과 새 이름을 넘긴다", async () => {
    const { controller, service } = makeController();
    await controller.rename(
      { groupId: "g1", role: "owner" },
      { name: "새 이름" },
    );

    expect(service.rename).toHaveBeenCalledWith("g1", "owner", "새 이름");
  });

  it("rotate 는 멤버십 역할로 초대 코드를 재발급한다", async () => {
    const { controller, service } = makeController();
    await controller.rotate({ groupId: "g1", role: "owner" });

    expect(service.rotateInvite).toHaveBeenCalledWith("g1", "owner");
  });

  it("members 는 멤버 목록을 조회한다", async () => {
    const { controller, service } = makeController();
    await controller.members({ groupId: "g1", role: "member" });

    expect(service.listMembers).toHaveBeenCalledWith("g1");
  });

  it("removeMember 는 요청자·역할·대상으로 멤버를 삭제한다", async () => {
    const { controller, service } = makeController();
    await controller.removeMember(
      { id: "owner-id" },
      { groupId: "g1", role: "owner" },
      "u2",
    );

    expect(service.removeMember).toHaveBeenCalledWith(
      "g1",
      "owner-id",
      "owner",
      "u2",
    );
  });
});
