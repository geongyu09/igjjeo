#!/usr/bin/env bash
#
# apps/mobile를 Android 실기기에 dev-client로 로컬 빌드·설치한다.
# EAS는 절대 사용하지 않는다 — 순수 로컬 빌드(expo run:android)만.
#
# 사용법:
#   bun run dev-build:android              # LAN IP 자동 감지(기본 라우트 인터페이스)
#   bun run dev-build:android 192.168.0.10 # LAN IP 직접 지정
#   bun run dev-build:android 10.0.2.2     # 에뮬레이터에서 호스트를 가리키는 별칭
#   WEB_PORT=3000 API_PORT=4000 bun run dev-build:android  # 포트 직접 지정
#
# 감지한 LAN IP로 .env.development.local 의 EXPO_PUBLIC_WEB_URL·EXPO_PUBLIC_API_BASE_URL 을
# 함께 갱신한다 (실기기에서는 web·API 둘 다 localhost가 아니라 개발 머신 LAN IP로 붙어야 함).
# 이 파일은 dev/Debug 빌드에서만 로드되므로, Release(프로토타입) 빌드의 호스팅 URL과 섞이지 않는다.
# 에뮬레이터는 localhost 대신 10.0.2.2 가 호스트를 가리키므로, 그 경우 인자로 10.0.2.2 를 넘긴다.
# 프로토타입(Release·standalone) 빌드는 proto-build-android.sh + .env.production 을 쓴다.
#
set -euo pipefail

# apps/mobile 디렉토리로 이동 (이 스크립트 위치 기준)
cd "$(dirname "$0")/.."

PORT="${WEB_PORT:-3000}"

# 1) LAN IP 확인 (인자 > 기본 라우트 인터페이스 > 전체 인터페이스 스캔).
#    localhost는 폰 자신을 가리키므로 금지. 폰이 붙을 수 있는 사설 대역만 채택
#    (VPN·AirDrop·브리지 등 가상 인터페이스와 공인/특수 주소는 제외).
#    10.0.2.2(에뮬레이터→호스트 별칭)는 인자로 직접 넘겼을 때만 통과시킨다.
is_private_ip() {
  case "$1" in
    10.*|192.168.*) return 0 ;;
    172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) return 0 ;;
    *) return 1 ;;
  esac
}

# 인터페이스의 IPv4를 얻는다: DHCP(ipconfig getifaddr) 우선, 없으면 static(ifconfig).
iface_ipv4() {
  ipconfig getifaddr "$1" 2>/dev/null \
    || ifconfig "$1" 2>/dev/null | awk '/inet /{print $2; exit}'
}

detect_lan_ip() {
  local ip ifc def_if
  # 기본 라우트가 나가는 인터페이스를 최우선으로 본다 (실제 인터넷/LAN 경로).
  def_if="$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')"
  if [ -n "$def_if" ]; then
    ip="$(iface_ipv4 "$def_if")"
    if [ -n "$ip" ] && is_private_ip "$ip"; then echo "$ip"; return 0; fi
  fi
  # 그 외 모든 물리 인터페이스 스캔 (en5~ USB/썬더볼트 이더넷 포함).
  for ifc in $(ifconfig -l 2>/dev/null); do
    case "$ifc" in lo*|utun*|ipsec*|ppp*|awdl*|llw*|bridge*|gif*|stf*) continue ;; esac
    [ "$ifc" = "$def_if" ] && continue
    ip="$(iface_ipv4 "$ifc")"
    if [ -n "$ip" ] && is_private_ip "$ip"; then echo "$ip"; return 0; fi
  done
  return 1
}

# 인자로 넘긴 주소는 그대로 신뢰한다 (에뮬레이터 별칭 10.0.2.2 등 허용).
IP="${1:-}"
[ -z "$IP" ] && IP="$(detect_lan_ip || true)"
if [ -z "$IP" ]; then
  echo "LAN IP를 찾지 못했습니다. 직접 지정하세요: bun run dev-build:android 192.168.0.10" >&2
  echo "  (에뮬레이터라면: bun run dev-build:android 10.0.2.2)" >&2
  exit 1
fi

API_PORT="${API_PORT:-4000}"
WEB_URL="http://${IP}:${PORT}"
API_URL="http://${IP}:${API_PORT}/v1"
echo "→ EXPO_PUBLIC_WEB_URL      = ${WEB_URL}"
echo "→ EXPO_PUBLIC_API_BASE_URL = ${API_URL}"

# 2) .env.development.local 갱신 (해당 키만 교체, 없으면 추가). macOS/BSD sed.
#    dev/Debug 빌드·`expo start`에서만 로드되는 파일이라, Release용 .env.production 을 덮지 않는다.
#    URL 에는 sed 구분자(|)가 없으므로 이스케이프 불필요.
ENV_FILE=".env.development.local"
upsert_env() {
  local key="$1" value="$2"
  if [ -f "$ENV_FILE" ] && grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}
upsert_env EXPO_PUBLIC_WEB_URL "$WEB_URL"
upsert_env EXPO_PUBLIC_API_BASE_URL "$API_URL"

# 3) 실기기/에뮬레이터 로컬 빌드 (dev-client, Debug 기본).
#    Android 기기는 USB 디버깅 허용(adb) 또는 실행 중인 에뮬레이터가 필요하다.
echo "→ Android 빌드를 시작합니다. 연결된 기기/에뮬레이터를 확인하세요 (adb devices)."
exec bunx expo run:android --device
