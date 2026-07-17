import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMe = vi.fn();
vi.mock("@/lib/data/profile", () => ({
  getMe: () => getMe(),
}));

import { useMeSuspenseQuery } from ".";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

describe("useMeSuspenseQuery", () => {
  beforeEach(() => getMe.mockReset());

  it("getMe 결과를 data로 노출한다 (해소 전 서스펜드)", async () => {
    getMe.mockResolvedValue({ id: "u1", masked_name: "김*규" });
    const { result } = renderHook(() => useMeSuspenseQuery(), { wrapper });

    await waitFor(() => expect(result.current?.data).toBeDefined());
    expect(result.current.data).toEqual({ id: "u1", masked_name: "김*규" });
    expect(getMe).toHaveBeenCalledOnce();
  });
});
