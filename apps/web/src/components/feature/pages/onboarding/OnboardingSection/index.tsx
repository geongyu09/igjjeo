"use client";

import { ArrowRight } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/common/shared/ui/Button";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { ScreenHeader } from "@/components/common/shared/ui/ScreenHeader";
import { onboardingStore } from "@/lib/session/onboardingStore";

import { FlowSlide } from "./components/FlowSlide";
import { OutletsSlide } from "./components/OutletsSlide";
import { ProgressDots } from "./components/ProgressDots";
import { SafetySlide } from "./components/SafetySlide";
import { WelcomeSlide } from "./components/WelcomeSlide";
import styles from "./OnboardingSection.module.css";

const SLIDES: { cta: string; content: ReactNode }[] = [
  { cta: "어떻게 되는지 볼게요", content: <WelcomeSlide /> },
  { cta: "언론사가 궁금해요", content: <FlowSlide /> },
  { cta: "하나만 알려주세요", content: <OutletsSlide /> },
  { cta: "뉴스룸 시작하기", content: <SafetySlide /> },
];

export interface OnboardingSectionProps {
  /** 온보딩을 마쳤을 때(끝까지 봤거나 건너뛰었을 때) 다음 화면으로 보낸다. */
  onComplete: () => void;
}

/**
 * 첫 진입 온보딩 — 서비스 정의·제보에서 기사까지의 흐름·다섯 언론사·안전장치를 4장으로 설명하고
 * 뉴스룸으로 들여보낸다. 끝까지 보거나 건너뛰면 기기에 완료로 기록해 다시 뜨지 않는다.
 */
export function OnboardingSection({ onComplete }: OnboardingSectionProps) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const complete = () => {
    onboardingStore.markDone();
    onComplete();
  };

  const goNext = () => {
    if (isLast) {
      complete();
      return;
    }
    setIndex((current) => current + 1);
  };

  return (
    <MobileScreen
      bodyClassName={styles.bodyFill}
      header={
        <ScreenHeader
          className={styles.header}
          leading="none"
          trailing={
            isLast ? undefined : (
              <button type="button" className={styles.skip} onClick={complete}>
                건너뛰기
              </button>
            )
          }
        />
      }
      footer={
        <div className={styles.footer}>
          <ProgressDots current={index} total={SLIDES.length} />
          <Button size="lg" className={styles.cta} onClick={goNext}>
            {SLIDES[index].cta}
            <ArrowRight size={17} aria-hidden />
          </Button>
        </div>
      }
    >
      <div className={styles.body}>{SLIDES[index].content}</div>
    </MobileScreen>
  );
}
