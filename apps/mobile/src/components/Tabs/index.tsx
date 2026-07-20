import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

import type { RootStackParamList, TabParamList } from "../../navigation/types";
import { PlaceholderScreen } from "../PlaceholderScreen";
import { createWebTabScreen } from "../WebTabScreen";
import { tabIcon } from "./tabIcon";

const Tab = createBottomTabNavigator<TabParamList>();

// 웹 라우트를 여는 탭 화면 — 피드·뉴스룸·프로필이 실제 WebView를 렌더한다.
const FeedScreen = createWebTabScreen("/");
const RoomScreen = createWebTabScreen("/room");
const ProfileScreen = createWebTabScreen("/profile");

// 하단 탭 바. 5슬롯 — 피드(/)·검색(비활성)·제보(모달)·뉴스룸(/room)·프로필(/profile).
// 검색은 tabPress를 preventDefault로 막아 둔 자리 표시, 제보는 탭 전환 대신
// 부모 스택의 ReportModal을 연다.
export function TabsScreen() {
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
        name="Room"
        component={RoomScreen}
        options={{ title: "뉴스룸", tabBarIcon: tabIcon("people-outline") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "프로필", tabBarIcon: tabIcon("person-outline") }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  inertTab: {
    opacity: 0.4,
  },
});
