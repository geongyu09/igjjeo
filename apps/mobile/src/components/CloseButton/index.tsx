import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

// 제보 모달 헤더의 닫기(X) 버튼 — 네이티브가 그리는 헤더의 headerLeft에 놓인다.
export function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityLabel="닫기">
      <Ionicons name="close" size={26} color="#111114" />
    </Pressable>
  );
}
