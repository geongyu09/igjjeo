import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";

import type { RootStackParamList } from "../../navigation/types";
import { onboardingStore } from "../../session/onboardingStore";
import { WebPane } from "../WebPane";

type OnboardingNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

/**
 * 온보딩 섹션 — 웹 `/onboarding`(설명 4장)을 띄우고, 웹이 마지막 CTA나 건너뛰기로 보내는
 * `finishOnboarding` 요청을 받아 완료를 영속 기록한 뒤 로그인 화면으로 교체한다.
 *
 * 로그인 전 화면이라 브리지 요청은 `finishOnboarding` 하나만 받는다 — 공용
 * handleBridgeMessage 를 붙이면 미인증 상태에서 enterRoom 등으로 앱 안까지 들어갈 수 있다.
 */
export function OnboardingSection() {
  const navigation = useNavigation<OnboardingNavigation>();

  const onBridgeMessage = useCallback(
    async (message: WebToNativeRequest): Promise<WebToNativeResponse> => {
      if (message.type !== "finishOnboarding") return { success: false };
      await onboardingStore.markDone();
      // replace — 온보딩은 뒤로 돌아갈 화면이 아니다.
      navigation.replace("Login");
      return { success: true };
    },
    [navigation],
  );

  return <WebPane path="/onboarding" onBridgeMessage={onBridgeMessage} />;
}
