import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Next.js 웹 화면을 감싸는 WebView 셸.
// 실기기·Android 에뮬레이터에서는 localhost가 앱 자신을 가리키므로
// EXPO_PUBLIC_WEB_URL에 개발 머신의 LAN IP(예: http://192.168.0.10:3000)를 지정할 것.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebView source={{ uri: WEB_URL }} style={styles.webview} />
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
