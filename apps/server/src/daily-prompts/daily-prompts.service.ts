import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";

import { AdaptContentCommand } from "@/reports/adaptation/adapt-content.command";
import { OUTLET_KEYS } from "@/reports/adaptation/adaptation.types";
import type { Json } from "@/infra/supabase/database.types";

import {
  DailyPromptsRepository,
  type PromptRow,
} from "./daily-prompts.repository";

export interface PromptResponse {
  id: string;
  question: string;
  date: string;
  answer_count: number;
  answered_by_me: boolean;
}

/** 발행 최소 답변 수(그 미만이면 400). */
const MIN_ANSWERS = 1;

@Injectable()
export class DailyPromptsService {
  constructor(
    private readonly prompts: DailyPromptsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  /** 오늘(지정일)의 프롬프트. 없으면 null → 컨트롤러가 204. */
  async getToday(
    userId: string,
    groupId: string,
    date?: string,
  ): Promise<PromptResponse | null> {
    const view = await this.prompts.getPrompt(groupId, resolveDate(date), userId);
    if (!view) {
      return null;
    }
    return {
      id: view.id,
      question: view.question,
      date: view.date,
      answer_count: Number(view.answer_count),
      answered_by_me: view.answered_by_me,
    };
  }

  async answer(
    userId: string,
    groupId: string,
    promptId: string,
    answerText: string,
  ): Promise<Json> {
    await this.loadPromptInGroup(promptId, groupId);
    return this.prompts.upsertAnswer(promptId, userId, answerText);
  }

  async publish(
    userId: string,
    groupId: string,
    promptId: string,
  ): Promise<Json> {
    const prompt = await this.loadPromptInGroup(promptId, groupId);
    if (prompt.published_report_id) {
      throw new ConflictException({
        error: { code: "conflict", message: "이미 발행된 프롬프트입니다" },
      });
    }

    const answers = await this.prompts.listAnswers(promptId);
    if (answers.length < MIN_ANSWERS) {
      throw new BadRequestException({
        error: {
          code: "validation_failed",
          message: "발행하려면 답변이 더 필요합니다",
          details: { answer_count: answers.length, min: MIN_ANSWERS },
        },
      });
    }

    const rawText = buildRawText(prompt.question, answers);
    const drafts = await this.commandBus.execute(
      new AdaptContentCommand(groupId, rawText, OUTLET_KEYS),
    );

    return this.prompts.publish({
      promptId,
      groupId,
      reporterId: userId,
      rawText,
      articles: drafts,
    });
  }

  /** 프롬프트 시딩(owner). 같은 날 이미 있으면 409. */
  async seed(
    userId: string,
    groupId: string,
    role: string,
    question: string,
    date: string,
  ): Promise<PromptRow> {
    if (role !== "owner") {
      throw new ForbiddenException({
        error: { code: "forbidden", message: "방 관리자만 질문을 띄울 수 있습니다" },
      });
    }

    const existing = await this.prompts.getPrompt(groupId, date, userId);
    if (existing) {
      throw new ConflictException({
        error: { code: "conflict", message: "그날의 질문이 이미 있습니다" },
      });
    }

    return this.prompts.create(groupId, question, date);
  }

  private async loadPromptInGroup(
    promptId: string,
    groupId: string,
  ): Promise<PromptRow> {
    const prompt = await this.prompts.getById(promptId);
    // 방 밖 프롬프트는 존재를 숨긴다(404).
    if (!prompt || prompt.group_id !== groupId) {
      throw new NotFoundException({
        error: { code: "not_found", message: "질문을 찾을 수 없습니다" },
      });
    }
    return prompt;
  }
}

function resolveDate(date?: string): string {
  return date ?? new Date().toISOString().slice(0, 10);
}

function buildRawText(
  question: string,
  answers: { answer_text: string }[],
): string {
  const lines = answers.map((a) => `- ${a.answer_text}`);
  return [`오늘의 질문: ${question}`, ...lines].join("\n");
}
