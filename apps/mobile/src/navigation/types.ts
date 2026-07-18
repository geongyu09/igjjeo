export type RootStackParamList = {
  // 로그인 — 앱이 직접 그리는 네이티브 화면(Google/Apple). 초기 라우트.
  // 로그인 성공(또는 기존 세션 감지) 시 네이티브가 Tabs로 스택을 교체한다.
  Login: undefined;
  Tabs: undefined;
  // 탭에서 진입하는 풀스크린 WebView 스크린 (탭 바를 가림). url은 웹 라우트 경로.
  WebScreen: { url: string };
  // 제보하기 — 탭 전환 대신 모달로 올라오는 WebView 스크린.
  ReportModal: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Search: undefined;
  Report: undefined;
  Notifications: undefined;
  Profile: undefined;
};
