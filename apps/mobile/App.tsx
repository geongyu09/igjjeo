import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CloseButton } from "./src/components/CloseButton";
import { ReportModalScreen } from "./src/components/ReportModalScreen";
import { TabsScreen } from "./src/components/Tabs";
import { WebScreen } from "./src/components/WebScreen";
import { navigationRef } from "./src/navigation/navigationRef";
import type { RootStackParamList } from "./src/navigation/types";

const RootStack = createNativeStackNavigator<RootStackParamList>();

// 앱 루트. 네이티브 스택 — Tabs(하단 탭), 상세 진입용 풀스크린 WebScreen,
// 제보 모달 ReportModal. 각 화면 컴포넌트는 src/components 아래에 분리돼 있다.
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs" component={TabsScreen} />
          {/* iOS 엣지 스와이프 제스처는 WebScreen이 웹 canGoBack에 따라 동적으로 켜고 끈다
              (setSwipeBackEnabled). 기본값(true)은 웹 루트 상태와 일치한다. */}
          <RootStack.Screen name="WebScreen" component={WebScreen} />
          <RootStack.Screen
            name="ReportModal"
            component={ReportModalScreen}
            options={({ navigation }) => ({
              presentation: "modal",
              headerShown: true,
              title: "제보하기",
              headerLeft: () => (
                <CloseButton onPress={() => navigation.goBack()} />
              ),
            })}
          />
        </RootStack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
