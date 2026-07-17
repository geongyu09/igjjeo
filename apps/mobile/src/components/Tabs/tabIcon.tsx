import { Ionicons } from "@expo/vector-icons";

// 탭 바 아이콘 render prop 팩토리. Ionicons 이름을 고정한 tabBarIcon 콜백을 만든다.
export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}
