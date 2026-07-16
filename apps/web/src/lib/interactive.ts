import type { KeyboardEvent } from "react";

/**
 * 카드 등 비버튼 요소를 클릭 타깃으로 만들 때의 접근성 props.
 * role=button + tabIndex + Enter/Space 키 조작을 함께 제공한다.
 */
export function pressable(onPress: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onPress,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onPress();
      }
    },
  };
}
