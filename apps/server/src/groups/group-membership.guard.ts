import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import type { AuthUser } from "@/auth/current-user.decorator";

import { FindMembershipQuery } from "./cqrs/find-membership.query";

/** 요청자의 방 멤버십. GroupMembershipGuard 가 request 에 실어 둔다. */
export interface Membership {
  groupId: string;
  role: string;
}

interface GuardedRequest {
  user?: AuthUser;
  params?: Record<string, string | undefined>;
  membership?: Membership;
}

/**
 * 방-스코프 인가 가드(RLS 대체, conventions.md §3). 라우트의 `:groupId` 를 읽어
 * 요청자가 그 방의 멤버인지 검사하고, 아니면 404 로 존재 자체를 숨긴다.
 * JwtUserGuard 뒤에 두어 request.user 가 채워진 뒤 동작한다.
 */
@Injectable()
export class GroupMembershipGuard implements CanActivate {
  constructor(private readonly queryBus: QueryBus) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GuardedRequest>();
    const userId = request.user?.id;
    const groupId = request.params?.groupId;

    if (!userId || !groupId) {
      throw notFound();
    }

    const membership = await this.queryBus.execute(
      new FindMembershipQuery(groupId, userId),
    );
    if (!membership) {
      throw notFound();
    }

    request.membership = { groupId, role: membership.role };
    return true;
  }
}

/** 핸들러에서 요청자의 방 멤버십(역할)을 꺼낸다. */
export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Membership => {
    const request = ctx.switchToHttp().getRequest<GuardedRequest>();
    return request.membership as Membership;
  },
);

function notFound(): NotFoundException {
  return new NotFoundException({
    error: { code: "not_found", message: "방을 찾을 수 없습니다" },
  });
}
