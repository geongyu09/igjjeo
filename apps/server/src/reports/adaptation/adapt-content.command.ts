import { Command, CommandHandler, type ICommandHandler } from "@nestjs/cqrs";

import { AdaptationService, type AdaptOptions } from "./adaptation.service";
import type { DraftArticle, OutletKey } from "./adaptation.types";

/**
 * 원문을 언론사별 기사 초안으로 각색한다(reports/adaptation 소유). AI 호출·실명 마스킹·
 * 거부(422)·장애(503) 처리는 어댑터 봉합선 한 곳에서. corrections·daily-prompts 는
 * ReportsModule 을 직접 의존하는 대신 이 커맨드를 CommandBus 로 보낸다.
 */
export class AdaptContentCommand extends Command<DraftArticle[]> {
  constructor(
    readonly groupId: string,
    readonly rawText: string,
    readonly outletKeys: OutletKey[],
    readonly options: AdaptOptions = {},
  ) {
    super();
  }
}

@CommandHandler(AdaptContentCommand)
export class AdaptContentHandler implements ICommandHandler<
  AdaptContentCommand,
  DraftArticle[]
> {
  constructor(private readonly adaptation: AdaptationService) {}

  execute(command: AdaptContentCommand): Promise<DraftArticle[]> {
    return this.adaptation.adapt(
      command.groupId,
      command.rawText,
      command.outletKeys,
      command.options,
    );
  }
}
