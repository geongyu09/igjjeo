import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMe = vi.fn();
vi.mock("@/lib/data/profile", () => ({
  getMe: () => getMe(),
}));

import { useMeQuery } from ".";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useMeQuery", () => {
  beforeEach(() => getMe.mockReset());

  it("getMe 결과를 data로 노출한다", async () => {
    getMe.mockResolvedValue({ id: "u1", masked_name: "김*규" });
    const { result } = renderHook(() => useMeQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "u1", masked_name: "김*규" });
    expect(getMe).toHaveBeenCalledOnce();
  });
});
