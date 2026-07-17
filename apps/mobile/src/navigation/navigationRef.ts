import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

// 루트 스택 ref — 브리지 핸들러(handleBridgeMessage)에서 스크린 push/pop을
// dispatch하고, App의 NavigationContainer에 연결된다.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
