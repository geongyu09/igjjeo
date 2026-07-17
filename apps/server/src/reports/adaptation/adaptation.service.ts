import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import { ListGroupMembersQuery } from "@/groups/cqrs/list-group-members.query";

import { AdaptationUnavailableError } from "./adaptation.logic";
import {
  ADAPTATION_PORT,
  type AdaptationPort,
  type DraftArticle,
  type OutletKey,
} from "./adaptation.types";

export interface AdaptOptions {
  isSelfReport?: boolean;
  isCorrection?: boolean;
}

/**
 * AI 각색 호출의 도메인 봉합선. 방 멤버 매칭으로 실명→마스킹 subjects 를 구성해
 * 어댑터를 호출하고, 어댑터의 거부/장애를 표준 HTTP 에러(422/503)로 변환한다.
 * reports·corrections·daily-prompts 가 이 한 곳을 경유해 각색을 호출한다.
 */
@Injectable()
export class AdaptationService {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(ADAPTATION_PORT) private readonly adapter: AdaptationPort,
  ) {}

  async adapt(
    groupId: string,
    rawText: string,
    outletKeys: OutletKey[],
    options: AdaptOptions = {},
  ): Promise<DraftArticle[]> {
    const subjects = await this.resolveSubjects(groupId, rawText);

    let result;
    try {
      result = await this.adapter.adaptReport({
        rawText,
        outletKeys,
        subjects,
        isSelfReport: options.isSelfReport ?? false,
        isCorrection: options.isCorrection,
      });
    } catch (err) {
      if (err instanceof AdaptationUnavailableError) {
        throw new ServiceUnavailableException({
          error: {
            code: "ai_unavailable",
            message: "각색 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요",
          },
        });
      }
      throw err;
    }

    if (result.status === "refused") {
      throw new UnprocessableEntityException({
        error: {
          code: "adaptation_refused",
          message: result.message,
          details: { reason: result.reason },
        },
      });
    }

    return result.articles;
  }

  /** 방 멤버 중 원문에 실명이 등장하는 사람만 골라 {실명, 마스킹} 쌍으로 만든다. */
  private async resolveSubjects(
    groupId: string,
    rawText: string,
  ): Promise<{ rawName: string; maskedName: string }[]> {
    const members = await this.queryBus.execute(
      new ListGroupMembersQuery(groupId),
    );
    return members
      .filter((m) => m.display_name && rawText.includes(m.display_name))
      .map((m) => ({ rawName: m.display_name, maskedName: m.masked_name }));
  }
}
