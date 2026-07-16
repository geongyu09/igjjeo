#!/usr/bin/env bash
#
# apps/mobile를 iOS 실기기에 dev-client로 로컬 빌드·설치한다.
# EAS는 절대 사용하지 않는다 — 순수 로컬 빌드(expo run:ios)만.
#
# 사용법:
#   bun run dev-build:ios              # LAN IP 자동 감지(en0→en1)
#   bun run dev-build:ios 192.168.0.10 # LAN IP 직접 지정
#   WEB_PORT=4000 bun run dev-build:ios
#
set -euo pipefail

# apps/mobile 디렉토리로 이동 (이 스크립트 위치 기준)
cd "$(dirname "$0")/.."

PORT="${WEB_PORT:-3000}"

# 1) LAN IP 확인 (인자 > en0 > en1). localhost는 폰 자신을 가리키므로 금지.
IP="${1:-}"
[ -z "$IP" ] && IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
[ -z "$IP" ] && IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$IP" ]; then
  echo "LAN IP를 찾지 못했습니다. 직접 지정하세요: bun run dev-build:ios 192.168.0.10" >&2
  exit 1
fi

URL="http://${IP}:${PORT}"
echo "→ EXPO_PUBLIC_WEB_URL = ${URL}"

# 2) .env 갱신 (EXPO_PUBLIC_WEB_URL 라인만 교체, 없으면 추가). macOS/BSD sed.
ENV_FILE=".env"
if [ -f "$ENV_FILE" ] && grep -q '^EXPO_PUBLIC_WEB_URL=' "$ENV_FILE"; then
  sed -i '' "s|^EXPO_PUBLIC_WEB_URL=.*|EXPO_PUBLIC_WEB_URL=${URL}|" "$ENV_FILE"
else
  printf 'EXPO_PUBLIC_WEB_URL=%s\n' "$URL" >> "$ENV_FILE"
fi

# 3) 실기기 로컬 빌드 (dev-client).
#    첫 빌드는 수 분 소요. Apple 계정 서명·기기 선택 프롬프트가 대화형으로 뜨고,
#    빌드 후 기기에서 '설정 > 일반 > VPN 및 기기 관리'로 개발자 앱을 신뢰해야 한다.
echo "→ 실기기 빌드를 시작합니다. 기기 선택·Apple 서명 프롬프트에 응답하세요."
exec bunx expo run:ios --device
