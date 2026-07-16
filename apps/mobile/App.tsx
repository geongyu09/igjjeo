import { WebviewWithBridge } from "@geongyu/bridge/native";
import { Ionicons } from "@expo/vector-icons";
import type {
  WebToNativeRequest,
  WebToNativeResponse,
} from "@igjjeo/bridge-contract";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createNavigationContainerRef,
  NavigationContainer,
  StackActions,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Next.js 웹 화면을 감싸는 WebView 셸.
// 실기기·Android 에뮬레이터에서는 localhost가 앱 자신을 가리키므로
// EXPO_PUBLIC_WEB_URL에 개발 머신의 LAN IP(예: http://192.168.0.10:3000)를 지정할 것.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";

// WebView User-Agent에 덧붙는 식별 토큰. apps/web의
// hooks/common/useIsNativeShell의 NATIVE_SHELL_UA_TOKEN과 항상 같아야 한다 —
// 웹은 이 토큰으로 앱 안임을 감지해 상세 진입을 stack-link 대신 브리지 push로 보낸다.
const NATIVE_SHELL_UA_TOKEN = "IgjjeoNativeShell";

// 웹 페이지 배경(apps/web globals.css의 --bg light 값 oklch(0.984 0.002 264))과
// 같은 색. 두 곳에 쓴다 — (1) safe area(노치·홈 인디케이터) 여백, (2) WebView 자체
// 배경. WebView 기본 배경은 흰색이라 이 색을 주지 않으면 웹 콘텐츠가 그려지기 전
// 로딩 동안 흰 화면이 깜빡여 색이 끊긴다. 앱은 라이트 모드 고정(app.json).
const WEB_BG = "#f9fafb";

type RootStackParamList = {
  Tabs: undefined;
  // 탭에서 진입하는 풀스크린 WebView 스크린 (탭 바를 가림). url은 웹 라우트 경로.
  WebScreen: { url: string };
  // 제보하기 — 탭 전환 대신 모달로 올라오는 WebView 스크린.
  ReportModal: undefined;
};

type TabParamList = {
  Feed: undefined;
  Search: undefined;
  Report: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 루트 스택 ref — 브리지 핸들러에서 스크린 push/pop을 dispatch한다.
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// 웹 → 네이티브 브리지 요청 처리 (탭 WebView·상세 WebScreen 공용, @geongyu/bridge).
// webview-architecture 네비게이션 플로우: 탭에서 상세 진입은 풀스크린 스크린 하나 push,
// 웹 스택이 비어 뒤로가면 그 스크린을 pop해 탭으로 복귀.
function handleBridgeMessage(message: WebToNativeRequest): WebToNativeResponse {
  if (!navigationRef.isReady()) return { success: false };
  switch (message.type) {
    case "pushScreen":
      navigationRef.dispatch(
        StackActions.push("WebScreen", { url: message.payload.url }),
      );
      return { success: true };
    case "popScreen":
      if (navigationRef.canGoBack()) navigationRef.dispatch(StackActions.pop());
      return { success: true };
    default:
      return { success: false };
  }
}

// 웹 라우트 하나를 렌더하는 WebView. 스크린 종류(탭·스택·모달)와 무관하게 공통이다.
function WebPane({ path }: { path: string }) {
  return (
    <WebviewWithBridge<WebToNativeRequest, WebToNativeResponse>
      source={{ uri: `${WEB_URL}${path}` }}
      style={styles.webview}
      applicationNameForUserAgent={NATIVE_SHELL_UA_TOKEN}
      // iOS: 링크 롱프레스 시 뜨는 미리보기(peek) 비활성화
      allowsLinkPreview={false}
      // 스크롤 끝에서 탄력적으로 튕기는 오버스크롤 제거 (iOS bounces / Android overScrollMode)
      bounces={false}
      overScrollMode="never"
      onBridgeMessage={handleBridgeMessage}
    />
  );
}

// 웹 라우트 하나를 렌더하는 탭 화면. 하단은 네이티브 탭 바가 차지하므로
// safe area는 위쪽만 처리한다.
function createWebTabScreen(path: string) {
  return function WebTabScreen() {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <WebPane path={path} />
      </SafeAreaView>
    );
  };
}

const FeedScreen = createWebTabScreen("/");
const ProfileScreen = createWebTabScreen("/profile");

// 제보하기 모달. 헤더(타이틀·닫기)는 네이티브가 그리므로 웹 /report는 자기 헤더를
// 렌더하지 않는다 (apps/web의 useIsNativeShell 분기). 상단 safe area는 헤더가 처리한다.
function ReportModalScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <WebPane path="/report" />
    </SafeAreaView>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityLabel="닫기">
      <Ionicons name="close" size={26} color="#111114" />
    </Pressable>
  );
}

// 탭에서 진입하는 풀스크린 상세 WebView. 탭 바를 가리므로 safe area를 위·아래 모두 처리한다.
// 이후 화면 전환은 이 WebView 안에서 전부 웹(stack-link)으로 진행된다.
function WebScreen({
  route,
}: NativeStackScreenProps<RootStackParamList, "WebScreen">) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <WebPane path={route.params.url} />
    </SafeAreaView>
  );
}

// 대응 웹 라우트가 없는 탭(검색·알림) 자리 — tabPress를 막아 두므로 실제 표시되지 않는다.
function PlaceholderScreen() {
  return <View style={styles.screen} />;
}

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

function TabsScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111114",
        tabBarInactiveTintColor: "#8a8a90",
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: "피드", tabBarIcon: tabIcon("newspaper-outline") }}
      />
      <Tab.Screen
        name="Search"
        component={PlaceholderScreen}
        options={{
          title: "검색",
          tabBarIcon: tabIcon("search-outline"),
          tabBarItemStyle: styles.inertTab,
        }}
        listeners={{ tabPress: (event) => event.preventDefault() }}
      />
      <Tab.Screen
        name="Report"
        component={PlaceholderScreen}
        options={{ title: "제보", tabBarIcon: tabIcon("add-circle") }}
        // 탭 전환 없이 제보 모달만 띄운다 — 화면 자체는 표시되지 않는다.
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation
              .getParent<NativeStackNavigationProp<RootStackParamList>>()
              ?.navigate("ReportModal");
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={PlaceholderScreen}
        options={{
          title: "알림",
          tabBarIcon: tabIcon("notifications-outline"),
          tabBarItemStyle: styles.inertTab,
        }}
        listeners={{ tabPress: (event) => event.preventDefault() }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "프로필", tabBarIcon: tabIcon("person-outline") }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs" component={TabsScreen} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
  webview: {
    flex: 1,
    backgroundColor: WEB_BG,
  },
  inertTab: {
    opacity: 0.4,
  },
});
