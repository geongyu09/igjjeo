import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

// 제보 모달 헤더의 닫기(X) 버튼 — 네이티브가 그리는 헤더의 headerLeft에 놓인다.
// disabled: 각색처럼 되돌릴 수 없는 작업이 진행 중일 때 흐리게 만들고 눌러도 반응하지 않는다.
export function CloseButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityLabel="닫기"
      accessibilityState={{ disabled }}
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      <Ionicons name="close" size={26} color="#111114" />
    </Pressable>
  );
}
