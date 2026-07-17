import type { AuthService } from "./auth.service";

import { AuthController } from "./auth.controller";

function makeController() {
  const service = {
    signup: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuthService>;
  return { controller: new AuthController(service), service };
}

describe("AuthController", () => {
  it("signup 은 display_name 을 서비스 인자로 넘긴다", async () => {
    const { controller, service } = makeController();
    const bundle = { profile: {}, access_token: "a" } as never;
    (service.signup as jest.Mock).mockResolvedValue(bundle);

    const result = await controller.signup({
      email: "kim@example.com",
      password: "password123",
      display_name: "김건규",
    });

    expect(service.signup).toHaveBeenCalledWith({
      email: "kim@example.com",
      password: "password123",
      displayName: "김건규",
    });
    expect(result).toBe(bundle);
  });

  it("login 은 이메일·비밀번호를 넘긴다", async () => {
    const { controller, service } = makeController();
    await controller.login({ email: "kim@example.com", password: "pw" });

    expect(service.login).toHaveBeenCalledWith({
      email: "kim@example.com",
      password: "pw",
    });
  });

  it("refresh 는 refresh_token 을 넘긴다", async () => {
    const { controller, service } = makeController();
    await controller.refresh({ refresh_token: "rt" });

    expect(service.refresh).toHaveBeenCalledWith("rt");
  });

  it("logout 은 요청자 id 와 refresh_token 으로 폐기한다", async () => {
    const { controller, service } = makeController();
    await controller.logout({ id: "user-1" }, { refresh_token: "rt" });

    expect(service.logout).toHaveBeenCalledWith("user-1", "rt");
  });
});
