import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import type { CommandBus } from "@nestjs/cqrs";

import { AdaptContentCommand } from "@/reports/adaptation/adapt-content.command";
import { OUTLET_KEYS } from "@/reports/adaptation/adaptation.types";

import { DailyPromptsService } from "./daily-prompts.service";
import type {
  DailyPromptsRepository,
  PromptRow,
  PromptView,
} from "./daily-prompts.repository";

const promptView: PromptView = {
  id: "p1",
  question: "오늘 가장 웃겼던 일은?",
  date: "2026-07-17",
  answer_count: 2,
  answered_by_me: true,
  published_report_id: null,
};

const promptRow: PromptRow = {
  id: "p1",
  group_id: "g1",
  question: "오늘 가장 웃겼던 일은?",
  date: "2026-07-17",
  published_report_id: null,
  created_at: "2026-07-17T00:00:00.000Z",
};

const draft = {
  outlet_key: "daily" as const,
  headline: "H",
  body: "B",
  reporter_name: "R",
};

function makeService() {
  const prompts = {
    getPrompt: jest.fn().mockResolvedValue(promptView),
    getById: jest.fn().mockResolvedValue(promptRow),
    upsertAnswer: jest.fn().mockResolvedValue({ id: "ans1" }),
    listAnswers: jest
      .fn()
      .mockResolvedValue([{ answer_text: "A1" }, { answer_text: "A2" }]),
    create: jest.fn().mockResolvedValue(promptRow),
    publish: jest.fn().mockResolvedValue({ report_id: "r1", articles: [] }),
  } as unknown as jest.Mocked<DailyPromptsRepository>;
  const commandBus = {
    execute: jest.fn().mockResolvedValue([draft, draft, draft]),
  } as unknown as jest.Mocked<CommandBus>;
  return {
    service: new DailyPromptsService(prompts, commandBus),
    prompts,
    commandBus,
  };
}

describe("DailyPromptsService", () => {
  describe("getToday", () => {
    it("프롬프트 뷰를 응답 형태로 매핑한다", async () => {
      const { service, prompts } = makeService();

      const result = await service.getToday("u1", "g1", "2026-07-17");

      expect(prompts.getPrompt).toHaveBeenCalledWith("g1", "2026-07-17", "u1");
      expect(result).toEqual({
        id: "p1",
        question: "오늘 가장 웃겼던 일은?",
        date: "2026-07-17",
        answer_count: 2,
        answered_by_me: true,
      });
    });

    it("프롬프트가 없으면 null(204)", async () => {
      const { service, prompts } = makeService();
      (prompts.getPrompt as jest.Mock).mockResolvedValue(null);

      await expect(service.getToday("u1", "g1", "2026-07-17")).resolves.toBeNull();
    });
  });

  describe("answer", () => {
    it("방 안 프롬프트면 답변을 upsert 한다", async () => {
      const { service, prompts } = makeService();

      await service.answer("u1", "g1", "p1", "내 답변");

      expect(prompts.upsertAnswer).toHaveBeenCalledWith("p1", "u1", "내 답변");
    });

    it("방 밖 프롬프트면 404(존재 은닉)", async () => {
      const { service, prompts } = makeService();
      (prompts.getById as jest.Mock).mockResolvedValue({
        ...promptRow,
        group_id: "other",
      });

      await expect(
        service.answer("u1", "g1", "p1", "내 답변"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("publish", () => {
    it("답변을 각색 커맨드로 넘겨 기사로 발행한다", async () => {
      const { service, prompts, commandBus } = makeService();

      await service.publish("u1", "g1", "p1");

      const command = (commandBus.execute as jest.Mock).mock
        .calls[0][0] as AdaptContentCommand;
      expect(command).toBeInstanceOf(AdaptContentCommand);
      expect(command.groupId).toBe("g1");
      expect(command.outletKeys).toEqual(OUTLET_KEYS);
      expect(command.rawText).toContain("오늘 가장 웃겼던 일은?");
      expect(command.rawText).toContain("A1");
      expect(prompts.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: "p1",
          groupId: "g1",
          reporterId: "u1",
          articles: [draft, draft, draft],
        }),
      );
    });

    it("이미 발행된 프롬프트면 409", async () => {
      const { service, prompts } = makeService();
      (prompts.getById as jest.Mock).mockResolvedValue({
        ...promptRow,
        published_report_id: "r0",
      });

      await expect(service.publish("u1", "g1", "p1")).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it("답변이 최소 수보다 적으면 400", async () => {
      const { service, prompts } = makeService();
      (prompts.listAnswers as jest.Mock).mockResolvedValue([]);

      await expect(service.publish("u1", "g1", "p1")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("seed", () => {
    it("owner 가 아니면 403", async () => {
      const { service } = makeService();

      await expect(
        service.seed("u1", "g1", "member", "질문", "2026-07-17"),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("그날 프롬프트가 이미 있으면 409", async () => {
      const { service } = makeService();

      await expect(
        service.seed("u1", "g1", "owner", "질문", "2026-07-17"),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("owner 이고 없으면 새 프롬프트를 시딩한다", async () => {
      const { service, prompts } = makeService();
      (prompts.getPrompt as jest.Mock).mockResolvedValue(null);

      const result = await service.seed("u1", "g1", "owner", "질문", "2026-07-17");

      expect(prompts.create).toHaveBeenCalledWith("g1", "질문", "2026-07-17");
      expect(result).toEqual(promptRow);
    });
  });
});
