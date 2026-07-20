import { normalizeInviteCode } from "../lib/deepLink";

// 대기 중인 초대 코드(메모리). 딥링크로 앱이 열렸는데 아직 로그인 전이면, 로그인 성공 뒤
// 방 허브로 진입할 때 이 코드를 실어 웹으로 넘긴다(LoginSection.enterApp). 세션이 이미 있으면
// 딥링크 핸들러가 곧바로 초대 라우트로 보내므로 이 저장소를 거치지 않는다.
// 영속이 필요 없다 — 한 번의 실행 안에서 로그인 직전까지만 들고 있으면 된다.

let pending: string | null = null;

export const pendingInviteStore = {
  /** 초대 코드를 정규화해 보관한다(유효하지 않으면 무시). */
  set(rawCode: string): void {
    const code = normalizeInviteCode(rawCode);
    if (code) pending = code;
  },

  /** 보관된 코드를 반환하고 비운다(1회성 소비). 없으면 null. */
  take(): string | null {
    const code = pending;
    pending = null;
    return code;
  },

  clear(): void {
    pending = null;
  },
};
