import { describe, expect, it } from "vitest";
import { resolveInstallPlatform } from "./resolveInstallTarget";

const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

describe("resolveInstallPlatform", () => {
  it("iPhone User-Agent는 ios로 판별한다", () => {
    expect(resolveInstallPlatform(IOS_UA)).toBe("ios");
  });

  it("iPad(데스크톱 모드 UA + 터치)도 ios로 판별한다", () => {
    expect(resolveInstallPlatform(IPAD_UA, { maxTouchPoints: 5 })).toBe("ios");
  });

  it("Android User-Agent는 android로 판별한다", () => {
    expect(resolveInstallPlatform(ANDROID_UA)).toBe("android");
  });

  it("데스크톱은 other로 판별한다", () => {
    expect(resolveInstallPlatform(DESKTOP_UA)).toBe("other");
  });
});
