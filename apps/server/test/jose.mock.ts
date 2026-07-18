/**
 * jest 용 jose 목. jose v6 는 ESM 전용이라 ts-jest(CommonJS) 스위트에서 로드가 깨진다.
 * 실제 jose 로직은 유닛 테스트에서 실행하지 않으므로(외부 provider 토큰 검증은 런타임 전용),
 * package.json 의 jest.moduleNameMapper 로 "jose" 를 이 목으로 치환한다.
 *
 * 이 파일은 tsconfig include(src) 밖이라 `tsc --noEmit` 대상이 아니다.
 */
export const createRemoteJWKSet = jest.fn(() => jest.fn());
export const jwtVerify = jest.fn();
