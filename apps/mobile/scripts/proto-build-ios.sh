#!/usr/bin/env bash
#
# apps/mobile를 iOS 실기기에 "프로토타입"으로 로컬 빌드·설치한다.
# EAS는 절대 사용하지 않는다 — 순수 로컬 빌드(expo run:ios)만.
#
# dev-build-ios.sh 와의 차이:
#   - LAN IP 감지·주입을 하지 않는다. 대신 .env.production 의 호스팅 URL을 그대로 쓴다.
#   - Release(--configuration Release)로 빌드한다 → JS 번들이 앱에 임베드되어 개발 머신 없이
#     단독 실행되는 standalone 앱이 된다 (Debug 는 Metro 개발 서버에 의존해 못 건넴).
#   - Release 번들 export 는 NODE_ENV=production 으로 돌기 때문에 Expo 가 .env.production 을
#     로드한다 (.env.development.local 의 LAN 값은 로드되지 않는다).
#
# 사용법:
#   1) cp .env.production.example .env.production
#   2) .env.production 의 두 URL을 배포된 web(Vercel)·server 주소로 채운다.
#   3) bun run dev-build:ios:proto
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

# 2) 프로토타입은 호스팅 URL이어야 한다 — localhost·사설 LAN IP가 남아 있으면 중단.
#    (그런 값은 개발 머신이 떠 있어야만 동작하므로 배포용 프로토타입엔 부적합.)
BAD="$(grep -E '^EXPO_PUBLIC_(WEB_URL|API_BASE_URL)=' "$ENV_FILE" \
        | grep -E 'localhost|127\.0\.0\.1|://10\.|://192\.168\.|://172\.(1[6-9]|2[0-9]|3[0-1])\.' \
        || true)"
if [ -n "$BAD" ]; then
  echo "$ENV_FILE 에 localhost/사설 LAN 주소가 남아 있습니다 — 배포된 호스팅 URL로 바꾸세요:" >&2
  echo "$BAD" >&2
  exit 1
fi

echo "→ .env.production 의 호스팅 URL로 Release(standalone) 빌드를 시작합니다."
grep -E '^EXPO_PUBLIC_(WEB_URL|API_BASE_URL)=' "$ENV_FILE" | sed 's/^/  /' >&2

# 3) 실기기 Release 로컬 빌드. Apple 서명·기기 선택 프롬프트가 대화형으로 뜬다.
#    빌드 후 기기에서 '설정 > 일반 > VPN 및 기기 관리'로 개발자 앱을 신뢰해야 한다.
exec bunx expo run:ios --configuration Release --device
