import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createGroup = vi.fn();
vi.mock("@/lib/data/groups", () => ({
  createGroup: (params: unknown) => createGroup(params),
}));

import { useCreateGroupMutation } from ".";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return { wrapper, invalidate };
}

describe("useCreateGroupMutation", () => {
  beforeEach(() => createGroup.mockReset());

  it("createGroup을 호출하고 성공 시 방 목록을 무효화한다", async () => {
    createGroup.mockResolvedValue({ id: "g1", name: "3조" });
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useCreateGroupMutation(), { wrapper });

    result.current.mutate({ name: "3조" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createGroup).toHaveBeenCalledWith({ name: "3조" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["groups"] });
  });
});
