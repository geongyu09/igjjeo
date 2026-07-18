import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { SessionTokens } from "@igjjeo/bridge-contract";

import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../../config/env";
import { oauthLogin } from "../../lib/authApi";
import type { RootStackParamList } from "../../navigation/types";
import { sessionStore } from "../../session/sessionStore";

// GoogleSignin 은 모듈 로드 시 한 번만 설정한다. webClientId 가 id_token 의 audience 가 되며
// 서버 GOOGLE_OAUTH_CLIENT_ID 와 같아야 한다(env.ts 참고).
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
});

type LoginNavigation = NativeStackNavigationProp<RootStackParamList, "Login">;

/**
 * 로그인 섹션 — Google/Apple 소셜 로그인. 로그인은 네이티브가 담당하는 유일한 화면이다
 * (webview-architecture 예외). 성공 시 세션을 secure-store 에 저장하고 스택을 방 허브(웹 /group)로
 * 교체한다. 방 허브 WebView(웹)가 브리지 getSession 으로 세션을 받아 방 목록을 그리고, 방을 고르면
 * 브리지 enterRoom 으로 하단 탭 화면(Tabs)으로 들어간다.
 * 기본 정보(이름 등) 입력은 웹 온보딩 화면이 담당한다.
 */
export function LoginSection() {
  const navigation = useNavigation<LoginNavigation>();
  // 초기: 기존 세션 확인 중. 세션이 있으면 로그인을 건너뛰고 방 허브로 간다.
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState<null | "google" | "apple">(null);

  const enterApp = useCallback(() => {
    // 로그인 후 방 허브(/group)로 랜딩 — 방을 고르면 그 안에서 enterRoom 으로 탭 화면에 진입한다.
    navigation.reset({
      index: 0,
      routes: [{ name: "WebScreen", params: { url: "/group" } }],
    });
  }, [navigation]);

  const finish = useCallback(
    async (tokens: SessionTokens) => {
      await sessionStore.set(tokens);
      enterApp();
    },
    [enterApp],
  );

  useEffect(() => {
    let active = true;
    void sessionStore.load().then((tokens) => {
      if (!active) return;
      if (tokens) enterApp();
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [enterApp]);

  const signInWithGoogle = useCallback(async () => {
    setPending("google");
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return; // 사용자가 취소
      const idToken = response.data.idToken;
      if (!idToken) throw new Error("Google idToken 을 받지 못했습니다");
      const tokens = await oauthLogin({
        provider: "google",
        idToken,
        name: response.data.user.name ?? undefined,
      });
      await finish(tokens);
    } catch (err) {
      console.warn("[Login] Google 로그인 실패", err);
      Alert.alert("로그인 실패", "구글 로그인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setPending(null);
    }
  }, [finish]);

  const signInWithApple = useCallback(async () => {
    setPending("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const idToken = credential.identityToken;
      if (!idToken) throw new Error("Apple identityToken 을 받지 못했습니다");
      const tokens = await oauthLogin({
        provider: "apple",
        idToken,
        name: fullNameToString(credential.fullName),
      });
      await finish(tokens);
    } catch (err) {
      if (isAppleCanceled(err)) return; // 사용자가 취소
      console.warn("[Login] Apple 로그인 실패", err);
      Alert.alert("로그인 실패", "애플 로그인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setPending(null);
    }
  }, [finish]);

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  const busy = pending !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>이거 진짜에요?</Text>
        <Text style={styles.subtitle}>로그인하고 우리 방 뉴스를 확인하세요</Text>
      </View>

      <View style={styles.buttons}>
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={styles.appleButton}
            onPress={busy ? () => {} : signInWithApple}
          />
        )}
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Light}
          disabled={busy}
          onPress={signInWithGoogle}
          style={styles.googleButton}
        />
        {busy && <ActivityIndicator style={styles.busy} />}
      </View>
    </View>
  );
}

function fullNameToString(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined {
  if (!fullName) return undefined;
  const parts = [fullName.familyName, fullName.givenName].filter(
    (part): part is string => Boolean(part),
  );
  const joined = parts.join(" ").trim();
  return joined.length > 0 ? joined : undefined;
}

function isAppleCanceled(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "ERR_REQUEST_CANCELED"
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#6b7280",
  },
  buttons: {
    gap: 12,
    alignItems: "center",
  },
  appleButton: {
    width: "100%",
    height: 48,
  },
  googleButton: {
    width: "100%",
    height: 48,
  },
  busy: {
    marginTop: 8,
  },
});
