import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";

// 스크린이 "다시" 포커스될 때(다른 스크린이 pop돼 이 WebView가 재노출) 웹으로 focus를 보내
// React Query를 무효화시킨다 (webview-architecture 네비게이션 플로우, 웹의 useNativeFocusRefetch).
//
// 네이티브가 WebView를 다른 스크린으로 덮어도 웹 DOM에는 visibilitychange/focus가 발생하지
// 않아, 웹은 복귀를 감지하지 못하고 다른 스크린에서 바뀐 서버 상태를 그대로 둔다. 그 복귀
// 신호를 브리지로 넘겨 이 간극을 메운다.
//
// - 최초 마운트 포커스는 건너뛴다 — WebView가 방금 로드돼 이미 fresh이므로 invalidate가 낭비다.
//   즉 "복귀"의 판별 = 최초가 아닌 focus 이벤트다.
// - sendFocus는 렌더마다 새로 만들어져도 되도록 ref로 최신값만 참조한다. 포커스 콜백 자체는
//   빈 deps로 고정해, 포커스 1회당 정확히 1번만 실행되게 한다(재구독으로 인한 중복 전송 방지).
export function useWebFocusRefetch(sendFocus: () => void) {
  const sendFocusRef = useRef(sendFocus);
  sendFocusRef.current = sendFocus;
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      sendFocusRef.current();
    }, []),
  );
}
