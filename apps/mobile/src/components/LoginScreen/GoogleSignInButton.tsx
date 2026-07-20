import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface GoogleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Google 로그인 버튼 — SDK 기본 GoogleSigninButton 대신 애플 버튼과 톤을 맞춘 커스텀 버튼.
 * 화이트 배경 + 컬러 로고(Google 라이트 스타일 가이드) + 높이 48/모서리 8로 애플 버튼과 통일한다.
 */
export function GoogleSignInButton({
  onPress,
  disabled,
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Google로 계속하기"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.logo}>
        <FontAwesome name="google" size={18} color="#4285F4" />
      </View>
      <Text style={styles.label}>Google로 계속하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dadce0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  logo: {
    position: "absolute",
    left: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
  },
});
