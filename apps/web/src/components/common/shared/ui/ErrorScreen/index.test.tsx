import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { ErrorScreen } from ".";

describe("ErrorScreen", () => {
  it("타임아웃이면 응답 지연 문구를 보여준다", () => {
    render(
      <ErrorScreen
        error={new ApiError({ status: 0, code: "timeout", message: "x" })}
      />,
    );

    expect(screen.getByText("서버가 응답하지 않아요")).toBeInTheDocument();
  });

  it("연결 실패면 요청한 API 주소를 진단 정보로 노출한다", () => {
    render(
      <ErrorScreen
        error={new ApiError({ status: 0, code: "network_error", message: "x" })}
        diagnostics
      />,
    );

    // 어떤 주소로 붙으려다 실패했는지 보여야 개발자가 LAN IP 불일치를 즉시 안다.
    expect(screen.getByTestId("error-diagnostics")).toHaveTextContent("/v1");
  });

  it("서버가 응답한 오류에는 진단 정보를 붙이지 않는다", () => {
    render(
      <ErrorScreen
        error={new ApiError({ status: 404, code: "not_found", message: "x" })}
        diagnostics
      />,
    );

    expect(screen.queryByTestId("error-diagnostics")).not.toBeInTheDocument();
  });

  it("diagnostics 가 꺼져 있으면 연결 실패여도 진단 정보를 감춘다", () => {
    render(
      <ErrorScreen
        error={new ApiError({ status: 0, code: "network_error", message: "x" })}
        diagnostics={false}
      />,
    );

    expect(screen.queryByTestId("error-diagnostics")).not.toBeInTheDocument();
  });
});
