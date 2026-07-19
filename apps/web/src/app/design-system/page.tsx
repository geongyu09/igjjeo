"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Flag,
  Flame,
  MoreHorizontal,
  Newspaper,
  Plus,
  SunMoon,
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/common/shared/ui/Avatar";
import { Badge } from "@/components/common/shared/ui/Badge";
import { Button } from "@/components/common/shared/ui/Button";
import { Chip } from "@/components/common/shared/ui/Chip";
import { EmptyState } from "@/components/common/shared/ui/EmptyState";
import { SegmentedControl } from "@/components/common/shared/ui/SegmentedControl";
import { TextArea } from "@/components/common/shared/ui/TextArea";
import { TextField } from "@/components/common/shared/ui/TextField";
import { Toggle } from "@/components/common/shared/ui/Toggle";
import { ArticleCard } from "@/components/feature/widget/ArticleCard";
import { CorrectionThread } from "@/components/feature/widget/CorrectionThread";
import { PublisherBadge } from "@/components/feature/widget/PublisherBadge";
import { PublisherRadioGroup } from "@/components/feature/widget/PublisherRadioGroup";
import { PublisherWordmark } from "@/components/feature/widget/PublisherWordmark";
import { ReactionBar } from "@/components/feature/widget/ReactionBar";
import { TrustBar } from "@/components/feature/widget/TrustBar";
import { OUTLET_KEYS, PUBLISHERS, type OutletKey } from "@/lib/publishers";
import type { ReactionType } from "@/lib/reactions";
import styles from "./page.module.css";

const NEUTRAL_SWATCHES = [
  { name: "bg", varName: "--bg" },
  { name: "surface", varName: "--surface" },
  { name: "surface-2", varName: "--surface-2" },
  { name: "surface-3", varName: "--surface-3" },
  { name: "ink", varName: "--ink" },
  { name: "border", varName: "--border" },
  { name: "border-2", varName: "--border-2" },
] as const;

const SEMANTIC_SWATCHES = [
  { name: "action", varName: "--action", note: "주요 버튼" },
  { name: "accent", varName: "--accent", note: "시그널 레드" },
  { name: "accent-weak", varName: "--accent-weak", note: "태그 배경" },
  { name: "success", varName: "--success", note: "인정 우세" },
  { name: "warning", varName: "--warning", note: "주의" },
] as const;

const TYPE_SCALE = [
  {
    className: "t-display",
    sample: "이거 진짜에요?",
    spec: "Display · 40 / 800",
  },
  {
    className: "t-h1",
    sample: "상습 지각, 이대로 괜찮은가",
    spec: "H1 · 26 / 800",
  },
  { className: "t-h2", sample: "이번 주 결산", spec: "H2 · 20 / 700" },
  {
    className: "t-title",
    sample: "기사 제목 / 리스트 타이틀",
    spec: "Title · 16 / 700",
  },
  {
    className: "t-body",
    sample:
      "충격. 또 늦었다. 벌써 세 번째. 조원들의 인내심이 한계에 다다랐다는 후문이다.",
    spec: "Body · 15 / 400",
  },
  {
    className: "t-body-s",
    sample: "보조 설명이나 캡션에 쓰는 작은 본문입니다.",
    spec: "Body S · 13 / 400",
  },
  {
    className: "t-label",
    sample: "LABEL · 라벨",
    spec: "Label · 11 / 700 · +tracking",
  },
  {
    className: "t-mono",
    sample: "👀 12 · 10:24 · 7K2Q",
    spec: "Mono · 시각·코드",
  },
] as const;

const SPACES = [4, 8, 12, 16, 24, 32, 48] as const;

const RADII = [
  { label: "sm·8", varName: "--r-sm" },
  { label: "md·12", varName: "--r-md" },
  { label: "lg·16", varName: "--r-lg" },
  { label: "xl·22", varName: "--r-xl" },
  { label: "pill", varName: "--r-pill" },
] as const;

const REACTION_COUNTS: Record<ReactionType, number> = {
  really: 2,
  shock: 5,
  admit: 7,
  scoop: 3,
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToColorScheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function usePrefersDark() {
  return useSyncExternalStore(
    subscribeToColorScheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
}

function SectionHeading({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className={styles.kicker}>{kicker}</div>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children && <p className={styles.sectionDescription}>{children}</p>}
    </>
  );
}

export default function DesignSystemPage() {
  const prefersDark = usePrefersDark();
  // data-theme 미지정 시 페이지는 시스템 테마를 따르므로, 토글 라벨도 시스템 값에서 출발한다
  const [themeOverride, setThemeOverride] = useState<"light" | "dark" | null>(
    null,
  );
  const theme = themeOverride ?? (prefersDark ? "dark" : "light");
  const [outletToggles, setOutletToggles] = useState<Record<string, boolean>>({
    shock: true,
    daily: false,
  });
  const [pickedOutlet, setPickedOutlet] = useState<OutletKey | null>("shock");
  const [pickMode, setPickMode] = useState("pick");
  const [target, setTarget] = useState("김*규");
  const [reportText, setReportText] = useState(
    "민규가 오늘도 지각했어요. 세 번째입니다.",
  );
  const [myReaction, setMyReaction] = useState<ReactionType | null>("admit");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeOverride(next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandName}>이거 진짜에요?</span>
          <span className={styles.brandSub}>DESIGN&nbsp;SYSTEM</span>
        </div>
        <Button variant="secondary" size="sm" pill onClick={toggleTheme}>
          <SunMoon size={15} aria-hidden />
          {theme === "dark" ? "다크" : "라이트"}
        </Button>
      </header>

      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.heroKicker}>소모임 뉴스 앱 · v1</div>
          <h1 className={styles.heroTitle}>
            이거 진짜에요?
            <br />
            디자인 시스템
          </h1>
          <p className={styles.heroDescription}>
            와이어프레임의 골격 위에 얹는 실제 비주얼 언어예요. 토큰 한 벌과
            자주 쓰는 공통 컴포넌트를 모아뒀습니다. 우상단에서 라이트·다크를
            바꿔볼 수 있어요.
          </p>
        </header>

        {/* ===== 색 ===== */}
        <section className={styles.section}>
          <SectionHeading kicker="Foundations" title="색">
            중립 뉴트럴을 바탕으로, 강조는 시그널 레드 하나로 절제해서 씁니다.
            모든 값은 <code className={styles.code}>oklch</code>로 정의돼
            라이트·다크가 자동 전환돼요.
          </SectionHeading>
          <div className={styles.swatchLabel}>중립 · Surface &amp; Text</div>
          <div className={styles.swatchGrid}>
            {NEUTRAL_SWATCHES.map((swatch) => (
              <div key={swatch.name} className={styles.swatch}>
                <div
                  className={styles.swatchColor}
                  style={{ background: `var(${swatch.varName})` }}
                />
                <div className={styles.swatchBody}>
                  <div className={styles.swatchName}>{swatch.name}</div>
                  <div className={styles.swatchVar}>{swatch.varName}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.swatchLabel}>브랜드 &amp; 시맨틱</div>
          <div className={styles.swatchGrid}>
            {SEMANTIC_SWATCHES.map((swatch) => (
              <div key={swatch.name} className={styles.swatch}>
                <div
                  className={styles.swatchColor}
                  style={{ background: `var(${swatch.varName})` }}
                />
                <div className={styles.swatchBody}>
                  <div className={styles.swatchName}>{swatch.name}</div>
                  <div className={styles.swatchVar}>{swatch.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 언론사 정체성 ===== */}
        <section className={styles.section}>
          <SectionHeading kicker="Foundations" title="언론사 정체성">
            같은 제보가 언론사를 거치면 전혀 다른 기사가 돼요. 색과 워드마크의
            무게·자간·기울기로 각 언론사의 성격을 드러냅니다.
            (모임과학·주간감성은 v2 확장)
          </SectionHeading>
          <div className={styles.pubGrid}>
            {OUTLET_KEYS.map((outlet) => (
              <div key={outlet} className={styles.pubCard}>
                <div className={styles.pubCardHead} data-outlet={outlet}>
                  <PublisherWordmark
                    outlet={outlet}
                    className={styles.pubWordmark}
                  />
                  <span className={styles.pubSwatch} />
                </div>
                <div className={styles.pubTagline}>
                  {PUBLISHERS[outlet].tagline}
                </div>
                <PublisherBadge outlet={outlet} />
              </div>
            ))}
          </div>
        </section>

        {/* ===== 타이포그래피 ===== */}
        <section className={styles.section}>
          <SectionHeading kicker="Foundations" title="타이포그래피">
            본문·헤드라인 모두 <b>Pretendard</b> 한 가족으로, 무게와 크기로만
            위계를 만듭니다. 코드·시각 등 메타 정보는 모노스페이스.
          </SectionHeading>
          <div className={styles.typeTable}>
            {TYPE_SCALE.map((row) => (
              <div key={row.spec} className={styles.typeRow}>
                <span className={row.className}>{row.sample}</span>
                <span className={styles.typeSpec}>{row.spec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 간격 · 라운드 · 그림자 ===== */}
        <section className={`${styles.section} ${styles.foundationGrid}`}>
          <div>
            <SectionHeading kicker="Foundations" title="간격" />
            <div className={styles.panel}>
              <div className={styles.spaceList}>
                {SPACES.map((space) => (
                  <div key={space} className={styles.spaceRow}>
                    <span className={styles.spaceLabel}>{space}</span>
                    <span
                      className={styles.spaceBar}
                      style={{ width: space }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <SectionHeading kicker="Foundations" title="라운드" />
            <div className={`${styles.panel} ${styles.radiusPanel}`}>
              {RADII.map((radius) => (
                <div key={radius.label} className={styles.radiusItem}>
                  <div
                    className={styles.radiusBox}
                    style={{ borderRadius: `var(${radius.varName})` }}
                  />
                  <div className={styles.radiusLabel}>{radius.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading kicker="Foundations" title="그림자" />
            <div className={`${styles.panel} ${styles.shadowPanel}`}>
              {(["sm", "md", "lg"] as const).map((size) => (
                <div key={size} className={styles.radiusItem}>
                  <div
                    className={styles.shadowBox}
                    style={{ boxShadow: `var(--shadow-${size})` }}
                  />
                  <div className={styles.radiusLabel}>{size}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Components ===== */}
        <div className={styles.componentsHeader}>
          <div className={styles.kickerAccent}>Components</div>
          <h2 className={styles.componentsTitle}>공통 컴포넌트</h2>
        </div>

        {/* 언론사 태그 · 배지 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>언론사 태그 · 배지</h3>
          <p className={styles.componentDescription}>
            피드·상세 어디서나 출처를 즉시 알리는 최소 단위.
          </p>
          <div className={styles.panel}>
            <div className={styles.demoRow}>
              {OUTLET_KEYS.map((outlet) => (
                <PublisherBadge key={outlet} outlet={outlet} />
              ))}
              <span className={styles.demoNote}>Soft · 기본</span>
            </div>
            <div className={styles.demoRow}>
              {(["shock", "science", "daily"] as const).map((outlet) => (
                <PublisherBadge key={outlet} outlet={outlet} variant="solid" />
              ))}
              <span className={styles.demoNote}>Solid · 강조</span>
            </div>
            <div className={styles.demoRow}>
              <Badge variant="accent">
                <Zap size={11} aria-hidden />
                속보
              </Badge>
              <Badge variant="accent-strong">정정</Badge>
              <Badge variant="neutral">단독</Badge>
              <Badge variant="success">사실로 굳음</Badge>
              <span className={styles.demoNote}>상태 배지</span>
            </div>
          </div>
        </section>

        {/* 버튼 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>버튼</h3>
          <p className={styles.componentDescription}>
            주요는 꽉 찬 잉크, 보조는 테두리, 고스트는 텍스트만. 최소 높이 44px.
          </p>
          <div className={styles.panel}>
            <div className={styles.demoRow}>
              <Button>
                기사 만들기
                <ArrowRight size={16} aria-hidden />
              </Button>
              <Button variant="secondary">언론사 변경</Button>
              <Button variant="ghost">다시 생성</Button>
              <Button variant="accent">
                <Flag size={15} aria-hidden />
                정정 요청
              </Button>
              <span className={styles.demoNote}>
                primary · secondary · ghost · accent
              </span>
            </div>
            <div className={styles.demoRow}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" iconOnly aria-label="더보기">
                <MoreHorizontal size={18} aria-hidden />
              </Button>
              <Button iconOnly pill aria-label="제보하기">
                <Plus size={20} aria-hidden />
              </Button>
              <span className={styles.demoNote}>sizes · disabled · icon</span>
            </div>
          </div>
        </section>

        {/* 입력 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>입력 · 텍스트에어리어</h3>
          <p className={styles.componentDescription}>
            제보 작성과 댓글의 기본. 포커스는 잉크 테두리로 또렷하게.
          </p>
          <div className={`${styles.panel} ${styles.inputGrid}`}>
            <div className={styles.inputColumn}>
              <TextField label="방 이름" placeholder="예: 3조 뉴스룸" />
              <TextField
                label="초대 코드"
                defaultValue="7K2"
                error="코드는 4자리예요"
              />
            </div>
            <TextArea
              label="무엇이 일어났나요?"
              maxLength={140}
              value={reportText}
              onChange={(event) => setReportText(event.target.value)}
            />
          </div>
        </section>

        {/* 토글 · 라디오 · 칩 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>토글 · 라디오 · 칩</h3>
          <p className={styles.componentDescription}>
            온/오프 설정, 언론사 선택, 세그먼트 전환에 씁니다.
          </p>
          <div className={`${styles.panel} ${styles.inputGrid}`}>
            <div>
              <div className={styles.demoLabel}>토글</div>
              <div className={styles.toggleList}>
                {(["shock", "daily"] as const).map((outlet) => (
                  <div key={outlet} className={styles.toggleRow}>
                    <span
                      className={styles.toggleName}
                      data-on={outletToggles[outlet] ? "" : undefined}
                    >
                      {PUBLISHERS[outlet].name} 표시
                    </span>
                    <Toggle
                      checked={outletToggles[outlet]}
                      onChange={(next) =>
                        setOutletToggles((prev) => ({
                          ...prev,
                          [outlet]: next,
                        }))
                      }
                      aria-label={`${PUBLISHERS[outlet].name} 표시`}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.demoLabel}>라디오 (하나만)</div>
              <PublisherRadioGroup
                outlets={["shock", "daily"]}
                value={pickedOutlet}
                onChange={setPickedOutlet}
                aria-label="언론사 선택"
              />
            </div>
            <div>
              <div className={styles.demoLabel}>세그먼트</div>
              <SegmentedControl
                options={[
                  { value: "pick", label: "내가 고르기" },
                  { value: "random", label: "무작위 3곳" },
                ]}
                value={pickMode}
                onChange={setPickMode}
                aria-label="언론사 선택 방식"
              />
              <div className={styles.demoLabel}>칩 (선택)</div>
              <div className={styles.demoRow}>
                {["김*규", "이*아", "박*호"].map((name) => (
                  <Chip
                    key={name}
                    selected={target === name}
                    onClick={() => setTarget(name)}
                  >
                    {name}
                  </Chip>
                ))}
                <Chip dashed>
                  <Plus size={13} aria-hidden />
                  직접
                </Chip>
              </div>
            </div>
          </div>
        </section>

        {/* 반응 + 신뢰도 바 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>반응 4종 + 신뢰도 바</h3>
          <p className={styles.componentDescription}>
            진짜? · 충격 · 인정 · 특종. 인정이 많으면 사실로 굳고, 진짜?가
            많으면 정정 요청으로 유도.
          </p>
          <div className={`${styles.panel} ${styles.narrowPanel}`}>
            <TrustBar
              admitCount={7}
              reallyCount={2}
              total={10}
              className={styles.trustBarDemo}
            />
            <ReactionBar
              counts={REACTION_COUNTS}
              myReaction={myReaction}
              onReact={(type) =>
                setMyReaction((prev) => (prev === type ? null : type))
              }
            />
          </div>
        </section>

        {/* 기사 카드 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>기사 카드</h3>
          <p className={styles.componentDescription}>
            한 제보 = 한 언론사 기사 하나. 피드 밀도에 따라 큰
            카드·리스트·톱기사·컴팩트를 골라 씁니다.
          </p>
          <div className={styles.cardShowcase}>
            <div className={styles.cardColumn}>
              <div className={styles.demoNote}>Large · 피드 기본</div>
              <ArticleCard
                outlet="shock"
                headline="【단독】 상습 지각, 이대로 괜찮은가"
                excerpt="충격. 또 늦었다. 벌써 세 번째. 조원들의 인내심이 한계에 다다랐다는 후문이다."
                viewCount={12}
                commentCount={5}
                reporterLabel="김*규"
              />
            </div>
            <div className={styles.cardColumn}>
              <div className={styles.demoNote}>Hero · 톱기사</div>
              <ArticleCard
                variant="hero"
                outlet="shock"
                headline="상습 지각, 이대로 괜찮은가"
                viewCount={12}
                reporterLabel="김*규"
                badge={
                  <Badge variant="accent">
                    <Flame size={11} aria-hidden />
                    오늘 가장 뜨거운
                  </Badge>
                }
              />
            </div>
            <div className={styles.cardColumn}>
              <div className={styles.demoNote}>List · 인덱스</div>
              <div className={styles.listContainer}>
                <ArticleCard
                  variant="list"
                  outlet="shock"
                  headline="【단독】 상습 지각, 이대로 괜찮은가"
                  viewCount={12}
                  commentCount={5}
                  timeLabel="방금"
                />
                <ArticleCard
                  variant="list"
                  outlet="science"
                  headline="간식 소진 가속의 원인은 실내 기압"
                  viewCount={7}
                  commentCount={2}
                  timeLabel="1시간"
                />
              </div>
              <div className={styles.demoNote}>Compact · 사진 없음</div>
              <ArticleCard
                variant="compact"
                outlet="daily"
                headline="김*규 씨, 오전 10시 12분 도착"
                viewCount={4}
                commentCount={1}
                timeLabel="2시간"
              />
            </div>
          </div>
        </section>

        {/* 아바타 · 프로필 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>아바타 · 프로필</h3>
          <p className={styles.componentDescription}>
            이니셜 아바타 기본. 프로필엔 활동 요약이 함께 붙어요.
          </p>
          <div className={`${styles.panel} ${styles.avatarPanel}`}>
            <div className={styles.avatarRow}>
              <Avatar name="김민규" size="sm" />
              <Avatar name="이서아" size="md" />
              <Avatar name="박준호" size="lg" emphasized />
              <Avatar size="lg" />
            </div>
            <div className={styles.profileDemo}>
              <div className={styles.profileHead}>
                <Avatar name="이서아" size="lg" emphasized />
                <div>
                  <div className={styles.profileName}>이*아</div>
                  <div className={styles.profileMeta}>
                    제보 9건 · 이번 주의 기자
                  </div>
                </div>
              </div>
              <div className={styles.demoLabel}>자주 고른 언론사</div>
              <div className={styles.demoRow}>
                <PublisherBadge outlet="shock" />
                <PublisherBadge outlet="emotion" />
              </div>
            </div>
          </div>
        </section>

        {/* 정정보도 스레드 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>정정보도 스레드</h3>
          <p className={styles.componentDescription}>
            원본→정정→재정정이 한 줄기로 쌓여요. 노드가 이어질수록 사건이 겹겹이
            부풀어 오릅니다.
          </p>
          <div className={`${styles.panel} ${styles.narrowPanel}`}>
            <CorrectionThread
              items={[
                {
                  outlet: "shock",
                  kind: "original",
                  headline: "【단독】 상습 지각, 이대로 괜찮은가",
                  meta: "원본 · 👀 12 · 인정 7 / 진짜? 2",
                },
                {
                  outlet: "daily",
                  kind: "correction",
                  headline: "본지는 앞선 보도를 정정합니다",
                  body: "김*규 씨는 지각한 것이 아니라, 애초에 참석하지 않은 것으로 확인됐다.",
                  meta: "제3자 정정 · 👀 21",
                },
                {
                  outlet: "shock",
                  kind: "recorrection",
                  headline: "【충격】 “안 왔다”는 주장마저 거짓이었나",
                  meta: "제3자 정정 · 👀 34 · 특종 9",
                },
              ]}
            />
          </div>
        </section>

        {/* 빈 상태 */}
        <section className={styles.componentSection}>
          <h3 className={styles.componentTitle}>빈 상태</h3>
          <p className={styles.componentDescription}>
            피드가 비었을 땐 서비스가 먼저 말을 겁니다. 부담 없이 첫 제보로
            이어지게.
          </p>
          <div className={`${styles.panel} ${styles.narrowPanel}`}>
            <EmptyState
              icon={<Newspaper size={26} aria-hidden />}
              title="아직 발행된 기사가 없어요"
              description={
                <>
                  첫 제보를 올리면
                  <br />
                  여기에 기사가 실려요
                </>
              }
              action={
                <Button pill>
                  <Plus size={16} aria-hidden />첫 제보하기
                </Button>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
