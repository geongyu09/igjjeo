import { isOriginAllowed, parseAllowedOrigins } from "./cors-origin";

describe("parseAllowedOrigins", () => {
  it("쉼표로 구분된 오리진 목록을 배열로 만든다", () => {
    expect(parseAllowedOrigins("https://a.com, https://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("빈 값이면 빈 배열이다", () => {
    expect(parseAllowedOrigins("")).toEqual([]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it("끝의 슬래시를 제거해 브라우저가 보내는 형식과 맞춘다", () => {
    expect(parseAllowedOrigins("https://a.com/")).toEqual(["https://a.com"]);
  });
});

describe("isOriginAllowed", () => {
  const allowList = ["https://igjjeo-web.vercel.app"];

  it("허용 목록에 있는 오리진은 통과한다", () => {
    expect(
      isOriginAllowed("https://igjjeo-web.vercel.app", {
        allowList,
        allowLocalNetwork: false,
      }),
    ).toBe(true);
  });

  it("허용 목록에 없는 오리진은 막는다", () => {
    expect(
      isOriginAllowed("https://evil.example.com", {
        allowList,
        allowLocalNetwork: false,
      }),
    ).toBe(false);
  });

  it("Origin 헤더가 없으면 통과시킨다", () => {
    // 네이티브 앱·서버간 호출·curl 은 Origin 을 보내지 않는다.
    // 브라우저가 아니므로 CORS 로 막을 대상이 아니다.
    expect(
      isOriginAllowed(undefined, { allowList, allowLocalNetwork: false }),
    ).toBe(true);
  });

  it("와일드카드 패턴으로 Vercel 프리뷰 도메인을 허용한다", () => {
    const withPreview = ["https://igjjeo-web-*.vercel.app"];

    expect(
      isOriginAllowed("https://igjjeo-web-abc123.vercel.app", {
        allowList: withPreview,
        allowLocalNetwork: false,
      }),
    ).toBe(true);
  });

  it("와일드카드가 다른 도메인으로 새지 않는다", () => {
    const withPreview = ["https://igjjeo-web-*.vercel.app"];

    // 접미사를 덧붙여 허용 도메인인 척하는 오리진을 막아야 한다.
    expect(
      isOriginAllowed("https://igjjeo-web-x.vercel.app.evil.com", {
        allowList: withPreview,
        allowLocalNetwork: false,
      }),
    ).toBe(false);
  });

  it("와일드카드는 서브도메인 구분자를 넘지 않는다", () => {
    const withPreview = ["https://igjjeo-web-*.vercel.app"];

    expect(
      isOriginAllowed("https://igjjeo-web-a.evil.vercel.app", {
        allowList: withPreview,
        allowLocalNetwork: false,
      }),
    ).toBe(false);
  });

  it("allowLocalNetwork 면 localhost 와 사설 IP 를 허용한다", () => {
    // 실기기 웹뷰는 LAN IP 오리진으로 붙고 그 IP 는 자주 바뀐다.
    const opts = { allowList: [], allowLocalNetwork: true };

    expect(isOriginAllowed("http://localhost:3000", opts)).toBe(true);
    expect(isOriginAllowed("http://127.0.0.1:3000", opts)).toBe(true);
    expect(isOriginAllowed("http://192.168.0.12:3000", opts)).toBe(true);
    expect(isOriginAllowed("http://10.0.1.5:3000", opts)).toBe(true);
  });

  it("allowLocalNetwork 가 아니면 localhost 도 막는다", () => {
    expect(
      isOriginAllowed("http://localhost:3000", {
        allowList,
        allowLocalNetwork: false,
      }),
    ).toBe(false);
  });

  it("allowLocalNetwork 여도 공인 오리진은 목록에 있어야 한다", () => {
    expect(
      isOriginAllowed("https://evil.example.com", {
        allowList,
        allowLocalNetwork: true,
      }),
    ).toBe(false);
  });

  it("잘못된 형식의 오리진은 막는다", () => {
    expect(
      isOriginAllowed("not-a-url", { allowList, allowLocalNetwork: true }),
    ).toBe(false);
  });
});
