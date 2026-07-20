import { LoadingScreen } from "@/components/common/shared/ui/LoadingScreen";

/**
 * 초대 경로형 링크(`/invite?code=<코드>`)의 목적지 라우트.
 *
 * 실제 처리는 InviteGate(레이아웃)가 쿼리를 가로채 담당한다 — 브라우저는 설치 안내로,
 * 앱은 세션 준비 후 PendingInviteConsumer가 자동 참여로 이어 간다. 이 라우트는 그 경로가
 * 404가 되지 않도록(iOS AASA·Android App Links가 참조하는 경로) 존재하며, 가로채기 전까지의
 * 짧은 순간에는 로딩만 보여 준다.
 */
export default function InvitePage() {
  return <LoadingScreen label="초대 확인 중" />;
}
