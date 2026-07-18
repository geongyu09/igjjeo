#!/usr/bin/env bash
#
# apps/mobile를 iOS 실기기에 dev-client로 로컬 빌드·설치한다.
# EAS는 절대 사용하지 않는다 — 순수 로컬 빌드(expo run:ios)만.
#
# 사용법:
#   bun run dev-build:ios              # LAN IP 자동 감지(en0→en1)
#   bun run dev-build:ios 192.168.0.10 # LAN IP 직접 지정
#   WEB_PORT=3000 API_PORT=4000 bun run dev-build:ios  # 포트 직접 지정
#
# 감지한 LAN IP로 .env 의 EXPO_PUBLIC_WEB_URL·EXPO_PUBLIC_API_BASE_URL 을 함께 갱신한다
# (실기기에서는 web·API 둘 다 localhost가 아니라 개발 머신 LAN IP로 붙어야 함).
#
set -euo pipefail

# apps/mobile 디렉토리로 이동 (이 스크립트 위치 기준)
cd "$(dirname "$0")/.."

PORT="${WEB_PORT:-3000}"

# 1) LAN IP 확인 (인자 > 기본 라우트 인터페이스 > 전체 인터페이스 스캔).
#    localhost는 폰 자신을 가리키므로 금지. 폰이 붙을 수 있는 사설 대역만 채택
#    (VPN·AirDrop·브리지 등 가상 인터페이스와 공인/특수 주소는 제외).
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

IP="${1:-}"
[ -z "$IP" ] && IP="$(detect_lan_ip || true)"
if [ -z "$IP" ]; then
  echo "LAN IP를 찾지 못했습니다. 직접 지정하세요: bun run dev-build:ios 192.168.0.10" >&2
  exit 1
fi

API_PORT="${API_PORT:-4000}"
WEB_URL="http://${IP}:${PORT}"
API_URL="http://${IP}:${API_PORT}/v1"
echo "→ EXPO_PUBLIC_WEB_URL      = ${WEB_URL}"
echo "→ EXPO_PUBLIC_API_BASE_URL = ${API_URL}"

# 2) .env 갱신 (해당 키만 교체, 없으면 추가). macOS/BSD sed.
#    URL 에는 sed 구분자(|)가 없으므로 이스케이프 불필요.
ENV_FILE=".env"
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

# 3) 실기기 로컬 빌드 (dev-client).
#    첫 빌드는 수 분 소요. Apple 계정 서명·기기 선택 프롬프트가 대화형으로 뜨고,
#    빌드 후 기기에서 '설정 > 일반 > VPN 및 기기 관리'로 개발자 앱을 신뢰해야 한다.
echo "→ 실기기 빌드를 시작합니다. 기기 선택·Apple 서명 프롬프트에 응답하세요."
exec bunx expo run:ios --device
