import { MobileScreen } from "@/components/common/shared/ui/MobileScreen";
import styles from "./NoSessionScreen.module.css";

/**
 * 세션을 확보하지 못했을 때의 화면. 로그인은 네이티브(Google/Apple)가 담당하므로
 * 네이티브 셸이 아닌 일반 브라우저(개발용)이거나, 네이티브 세션 복원에 실패했을 때 렌더한다.
 */
export function NoSessionScreen() {
  return (
    <MobileScreen>
      <div className={styles.wrap}>
        <p className={styles.message}>앱에서 로그인해 주세요.</p>
      </div>
    </MobileScreen>
  );
}
