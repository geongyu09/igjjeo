import type { Response } from "express";

import type { AuthUser } from "@/auth/current-user.decorator";
import type { Membership } from "@/groups/group-membership.guard";

import { DailyPromptsController } from "./daily-prompts.controller";
import type {
  DailyPromptsService,
  PromptResponse,
} from "./daily-prompts.service";

const user: AuthUser = { id: "u1" };
const membership: Membership = { groupId: "g1", role: "owner" };

const promptResponse: PromptResponse = {
  id: "p1",
  question: "오늘 가장 웃겼던 일은?",
  date: "2026-07-17",
  answer_count: 2,
  answered_by_me: false,
};

function makeController() {
  const service = {
    getToday: jest.fn().mockResolvedValue(promptResponse),
    answer: jest.fn().mockResolvedValue({ id: "ans1" }),
    publish: jest.fn().mockResolvedValue({ report_id: "r1" }),
    seed: jest.fn().mockResolvedValue({ id: "p1" }),
  } as unknown as jest.Mocked<DailyPromptsService>;
  return { controller: new DailyPromptsController(service), service };
}

function makeRes() {
  return { status: jest.fn().mockReturnThis() } as unknown as Response;
}

describe("DailyPromptsController", () => {
  describe("getToday", () => {
    it("프롬프트가 있으면 그대로 반환한다", async () => {
      const { controller, service } = makeController();
      const res = makeRes();

      const result = await controller.getToday(
        user,
        membership,
        { date: "2026-07-17" },
        res,
      );

      expect(service.getToday).toHaveBeenCalledWith("u1", "g1", "2026-07-17");
      expect(result).toEqual(promptResponse);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("프롬프트가 없으면 204 를 세팅하고 본문을 비운다", async () => {
      const { controller, service } = makeController();
      (service.getToday as jest.Mock).mockResolvedValue(null);
      const res = makeRes();

      const result = await controller.getToday(user, membership, {}, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(result).toBeUndefined();
    });
  });

  it("answer 는 요청자·방·프롬프트·답변을 서비스로 넘긴다", async () => {
    const { controller, service } = makeController();

    await controller.answer(user, membership, "p1", { answer_text: "내 답변" });

    expect(service.answer).toHaveBeenCalledWith("u1", "g1", "p1", "내 답변");
  });

  it("publish 는 요청자·방·프롬프트를 서비스로 넘긴다", async () => {
    const { controller, service } = makeController();

    await controller.publish(user, membership, "p1");

    expect(service.publish).toHaveBeenCalledWith("u1", "g1", "p1");
  });

  it("seed 는 요청자·방·역할·질문·날짜를 서비스로 넘긴다", async () => {
    const { controller, service } = makeController();

    await controller.seed(user, membership, {
      question: "새 질문",
      date: "2026-07-18",
    });

    expect(service.seed).toHaveBeenCalledWith(
      "u1",
      "g1",
      "owner",
      "새 질문",
      "2026-07-18",
    );
  });
});
