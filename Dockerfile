# apps/server (NestJS 도메인 백엔드) 컨테이너 이미지 — Cloud Run 배포 대상.
#
# 빌드 컨텍스트는 저장소 루트다. bun 워크스페이스(hoisted 링커)라
# 루트의 package.json/bun.lock/bunfig.toml 이 함께 있어야 의존성이 해석된다.
# --filter 로 서버 워크스페이스만 설치해 expo/next 계열을 이미지에서 배제한다.

# ── 1) deps: 매니페스트만 먼저 복사해 의존성 레이어를 캐시한다 ──
FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/bridge-contract/package.json packages/bridge-contract/
RUN bun install --frozen-lockfile --filter '@igjjeo/server'

# ── 2) builder: 소스를 얹고 nest build (dist 산출) ──
FROM deps AS builder
COPY apps/server apps/server
RUN bun run --cwd apps/server build

# ── 3) prod-deps: 런타임용 — devDependencies 제외하고 새로 설치 ──
FROM oven/bun:1.3.14-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/bridge-contract/package.json packages/bridge-contract/
RUN bun install --frozen-lockfile --production --filter '@igjjeo/server'

# ── 4) runner: 컴파일 결과만 담은 최종 이미지 ──
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY apps/server/package.json apps/server/
# 리스닝 포트는 Cloud Run 이 PORT 로 주입한다 (env.validation 이 PORT 를 우선).
EXPOSE 8080
USER node
CMD ["node", "apps/server/dist/main"]
