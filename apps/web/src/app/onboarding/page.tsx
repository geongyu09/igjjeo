"use client";

import { OnboardingSection } from "@/components/feature/pages/onboarding/OnboardingSection";
import { useFinishOnboarding } from "@/hooks/common/useFinishOnboarding";

/** 첫 진입 온보딩 — 앱을 처음 열면 로그인 전에 뜨는 설명 4장. */
export default function OnboardingPage() {
  const finish = useFinishOnboarding();
  return <OnboardingSection onComplete={finish} />;
}
