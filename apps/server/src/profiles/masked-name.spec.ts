import { deriveMaskedName } from "./masked-name";

describe("deriveMaskedName", () => {
  it("세 글자 이름은 가운데 글자를 마스킹한다", () => {
    expect(deriveMaskedName("홍길동")).toBe("홍*동");
  });

  it("두 글자 이름은 마지막 글자를 마스킹한다", () => {
    expect(deriveMaskedName("김구")).toBe("김*");
  });

  it("네 글자 이상은 가운데를 전부 마스킹한다", () => {
    expect(deriveMaskedName("남궁민수")).toBe("남**수");
  });

  it("앞뒤 공백은 제거하고 파생한다", () => {
    expect(deriveMaskedName("  홍길동  ")).toBe("홍*동");
  });

  it("한 글자 이름은 그대로 둔다(마스킹할 가운데가 없음)", () => {
    expect(deriveMaskedName("김")).toBe("김");
  });

  it("이모지 등 서로게이트 문자를 한 글자 단위로 센다", () => {
    expect(deriveMaskedName("😀길동")).toBe("😀*동");
  });
});
