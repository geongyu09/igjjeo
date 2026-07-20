#!/usr/bin/env bash
#
# apps/mobile를 "배포용 APK 파일"로만 로컬 빌드한다 (기기 연결 불필요).
# EAS는 절대 사용하지 않는다 — 순수 로컬 빌드(prebuild + Gradle)만.
#
# proto-build-android.sh(= expo run:android)와의 차이:
#   - 기기에 설치·실행하지 않는다. Gradle assembleRelease 로 APK 파일만 뽑는다.
#   - 산출물: android/app/build/outputs/apk/release/app-release.apk (이 파일을 사이드로드 배포).
#
# env·서명:
#   - NODE_ENV=production 으로 번들을 export 하므로 Expo 가 .env.production 을 로드한다
#     (.env.development.local 의 LAN 값은 로드되지 않는다).
#   - 서명은 Expo 안드로이드 템플릿 기본값(debug 키)으로 이뤄진다 — 사이드로딩엔 충분하지만
#     스토어 정식 배포용 서명은 범위 밖.
#
# 사용법:
#   1) cp .env.production.example .env.production
#   2) .env.production 의 두 URL을 배포된 web(Vercel)·server 주소로 채운다.
#   3) bun run build:android:apk
#
set -euo pipefail

# apps/mobile 디렉토리로 이동 (이 스크립트 위치 기준)
cd "$(dirname "$0")/.."

ENV_FILE=".env.production"

# 1) .env.production 존재 확인.
if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE 가 없습니다. 먼저 만들고 호스팅 URL을 채우세요:" >&2
  echo "  cp .env.production.example .env.production" >&2
  echo "  # 그 뒤 EXPO_PUBLIC_WEB_URL·EXPO_PUBLIC_API_BASE_URL 을 배포된 주소로 수정" >&2
  exit 1
fi

# 2) 프로토타입은 호스팅 URL이어야 한다 — localhost·사설 LAN IP(에뮬레이터 별칭 10.0.2.2 포함)가
#    남아 있으면 중단. (그런 값은 개발 머신이 떠 있어야만 동작하므로 배포용 APK엔 부적합.)
BAD="$(grep -E '^EXPO_PUBLIC_(WEB_URL|API_BASE_URL)=' "$ENV_FILE" \
        | grep -E 'localhost|127\.0\.0\.1|://10\.|://192\.168\.|://172\.(1[6-9]|2[0-9]|3[0-1])\.' \
        || true)"
if [ -n "$BAD" ]; then
  echo "$ENV_FILE 에 localhost/사설 LAN 주소가 남아 있습니다 — 배포된 호스팅 URL로 바꾸세요:" >&2
  echo "$BAD" >&2
  exit 1
fi

echo "→ .env.production 의 호스팅 URL로 배포용 APK를 빌드합니다."
grep -E '^EXPO_PUBLIC_(WEB_URL|API_BASE_URL)=' "$ENV_FILE" | sed 's/^/  /' >&2

# 3) 네이티브 프로젝트(android/) 생성 — 없을 때만. (app.json 변경 후 재생성하려면 android/ 삭제.)
#    deps는 이미 설치돼 있으므로 --no-install 로 lockfile을 건드리지 않는다.
if [ ! -d android ]; then
  echo "→ android/ 가 없어 expo prebuild 로 생성합니다."
  bunx expo prebuild --platform android --no-install
fi

# 4) Gradle 로 release APK 빌드 (JS 번들 export 는 NODE_ENV=production 으로 강제해
#    Expo 가 .env.production 을 확실히 로드하게 한다).
echo "→ Gradle assembleRelease 실행 (기기 불필요)."
( cd android && NODE_ENV=production ./gradlew assembleRelease )

# 5) 산출물 확인·안내.
APK="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  echo "✓ APK 생성됨: apps/mobile/${APK}"
  echo "  이 파일을 기기에 전송해 사이드로드하거나, 다음으로 설치:"
  echo "  adb install -r apps/mobile/${APK}"
else
  echo "APK를 찾지 못했습니다. Gradle 출력을 확인하세요 (경로: ${APK})." >&2
  exit 1
fi
