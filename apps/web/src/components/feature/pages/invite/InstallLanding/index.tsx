"use client";

import { Copy, Download, Smartphone } from "lucide-react";
import { useCallback } from "react";
import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import { useToast } from "@/components/common/shared/ui/Toast";
import { useInstallPlatform } from "@/hooks/common/useInstallPlatform";
import {
  androidApkUrl,
  buildAppOpenUrl,
  iosTestflightUrl,
} from "@/lib/install/config";
import styles from "./InstallLanding.module.css";

/**
 * 초대 링크를 브라우저에서 연 사용자에게 앱 설치를 안내하는 랜딩.
 *
 * 앱이 설치돼 있으면 OS가 Universal/App Link로 앱을 직접 열어 이 화면을 거치지 않는다.
 * 미설치 상태(브라우저)에서만 렌더되며, 초대 코드를 보여 주고 플랫폼별 설치 경로
 * (Android=APK 다운로드, iOS=TestFlight)를 제시한다. 설치 후 로그인하면 이 코드로 방에
 * 자동 참여되고, 자동 참여가 안 되면 코드를 직접 입력할 수 있게 코드를 복사하도록 돕는다.
 */
export function InstallLanding({ code }: { code: string }) {
  const platform = useInstallPlatform();
  const { showToast } = useToast();

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("초대 코드를 복사했어요");
    } catch {
      showToast("복사에 실패했어요");
    }
  }, [code, showToast]);

  const apkUrl = androidApkUrl();
  const testflightUrl = iosTestflightUrl();

  return (
    <MobileScreen>
      <div className={styles.wrap}>
        <div className={styles.badge} aria-hidden>
          <Smartphone size={28} />
        </div>
        <h1 className={styles.title}>뉴스룸 초대장</h1>
        <p className={styles.subtitle}>
          앱에서 이 초대를 확인하고 방에 참여하세요.
        </p>

        <div className={styles.codeBox}>
          <span className={styles.codeLabel}>초대 코드</span>
          <span className={styles.code}>{code}</span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={copyCode}
          >
            <Copy size={13} aria-hidden />
            코드 복사
          </button>
        </div>

        <div className={styles.actions}>
          {platform === "android" && (
            <StoreButton
              href={apkUrl}
              label="앱(APK) 설치하기"
              unavailableLabel="APK 링크가 아직 준비되지 않았어요"
            />
          )}
          {platform === "ios" && (
            <StoreButton
              href={testflightUrl}
              label="TestFlight로 설치하기"
              unavailableLabel="TestFlight 링크가 아직 준비되지 않았어요"
            />
          )}
          {platform === "other" && (
            <>
              <p className={styles.desktopHint}>
                휴대폰 브라우저에서 이 링크를 열면 설치 안내가 나와요.
              </p>
              <StoreButton
                href={apkUrl}
                label="Android APK 다운로드"
                unavailableLabel="APK 링크가 아직 준비되지 않았어요"
              />
              <StoreButton
                href={testflightUrl}
                label="iOS TestFlight"
                unavailableLabel="TestFlight 링크가 아직 준비되지 않았어요"
              />
            </>
          )}

          {platform !== "other" && (
            <a className={styles.openApp} href={buildAppOpenUrl(code)}>
              이미 앱이 설치돼 있어요 · 앱에서 열기
            </a>
          )}
        </div>

        <p className={styles.footnote}>
          설치 후 로그인하면 이 코드로 자동 참여돼요. 자동 참여가 안 되면 앱에서
          초대 코드를 직접 입력하세요.
        </p>
      </div>
    </MobileScreen>
  );
}

/** 스토어/다운로드 링크 버튼. URL이 없으면 비활성 안내를 보여 준다. */
function StoreButton({
  href,
  label,
  unavailableLabel,
}: {
  href: string;
  label: string;
  unavailableLabel: string;
}) {
  if (!href) {
    return (
      <span className={styles.storeButtonDisabled} aria-disabled>
        {unavailableLabel}
      </span>
    );
  }
  return (
    <a className={styles.storeButton} href={href}>
      <Download size={16} aria-hidden />
      {label}
    </a>
  );
}
