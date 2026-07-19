import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoginScreen } from "./src/components/LoginScreen";
import { ReportModalScreen } from "./src/components/ReportModalScreen";
import { TabsScreen } from "./src/components/Tabs";
import { WebScreen } from "./src/components/WebScreen";
import { navigationRef } from "./src/navigation/navigationRef";
import type { RootStackParamList } from "./src/navigation/types";

const RootStack = createNativeStackNavigator<RootStackParamList>();

// 앱 루트. 네이티브 스택 — 초기 라우트 Login(앱이 직접 그리는 네이티브 로그인 화면),
// Tabs(하단 탭), 상세 진입용 풀스크린 WebScreen, 제보 모달 ReportModal.
// 각 화면 컴포넌트는 src/components 아래에 분리돼 있다.
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {/* 초기 라우트 — 로그인(Google/Apple) 성공 시 스택을 Tabs로 교체한다.
              기존 세션이 있으면 로그인을 건너뛰고 바로 Tabs로 간다(LoginSection). */}
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Tabs" component={TabsScreen} />
          {/* iOS 엣지 스와이프 제스처는 WebScreen이 웹 canGoBack에 따라 동적으로 켜고 끈다
              (setSwipeBackEnabled). 기본값(true)은 웹 루트 상태와 일치한다.
              animationTypeForReplace: "pop" — replace(방 허브로 나가기 등)는 뒤로가기(반대 방향)
              슬라이드로 전환한다. push(상세 진입)에는 영향 없다. */}
          <RootStack.Screen
            name="WebScreen"
            component={WebScreen}
            options={{ animationTypeForReplace: "pop" }}
          />
          {/* 닫기(X) 버튼은 ReportModalScreen이 setOptions로 그린다 — 각색 진행 중에는
              비활성화해야 하므로 잠금 상태를 아는 스크린이 소유한다. */}
          <RootStack.Screen
            name="ReportModal"
            component={ReportModalScreen}
            options={{
              presentation: "modal",
              // 손가락으로 내려서 닫기(스와이프 dismiss) 금지 — 오직 X 버튼으로만 닫는다.
              gestureEnabled: false,
              headerShown: true,
              title: "제보하기",
            }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
