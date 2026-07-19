import { BlurView } from "expo-blur";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface BlurRevealProps {
  children: ReactNode;
  /** 블러가 걷히는 시간(ms). */
  duration?: number;
  /** 시작 블러 강도(1~100). */
  intensity?: number;
}

/**
 * 자식 위에 덮인 블러 오버레이가 마운트 시 서서히 걷히며 콘텐츠가 드러나는 진입 효과.
 * 로그인 화면이 나타날 때 "블러 느낌"의 등장 애니메이션을 준다. 오버레이는 opacity만
 * 애니메이션하므로 네이티브 드라이버로 매끄럽게 돌고, pointerEvents=none 이라 하위 버튼 조작을 막지 않는다.
 */
export function BlurReveal({
  children,
  duration = 700,
  intensity = 65,
}: BlurRevealProps) {
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [overlayOpacity, duration]);

  return (
    <View style={styles.root}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
      >
        <BlurView
          intensity={intensity}
          tint="light"
          blurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
