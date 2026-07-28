import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server-client", () => ({ createClient }));

import { getHeldIdsForCurrentUser } from "./id-wallet";

function makeSupabaseMock(opts: {
  user?: { id: string } | null;
  heldIds?: unknown;
  selectError?: unknown;
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({
      data: opts.heldIds !== undefined ? { held_ids: opts.heldIds } : null,
      error: opts.selectError ?? null,
    })),
  };
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: opts.user ?? null } })) },
    from: vi.fn(() => builder),
    builder,
  };
}

describe("getHeldIdsForCurrentUser", () => {
  beforeEach(() => {
    createClient.mockReset();
  });

  it("returns the signed-in user's saved held IDs", async () => {
    const client = makeSupabaseMock({ user: { id: "u1" }, heldIds: ["sss", "tin"] });
    createClient.mockResolvedValue(client);

    expect(await getHeldIdsForCurrentUser()).toEqual(["sss", "tin"]);
    expect(client.builder.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("returns [] when signed out", async () => {
    createClient.mockResolvedValue(makeSupabaseMock({ user: null }));

    expect(await getHeldIdsForCurrentUser()).toEqual([]);
  });

  it("returns [] when nothing has been saved yet", async () => {
    createClient.mockResolvedValue(makeSupabaseMock({ user: { id: "u1" }, heldIds: undefined }));

    expect(await getHeldIdsForCurrentUser()).toEqual([]);
  });

  it("returns [] on any read failure instead of throwing", async () => {
    createClient.mockResolvedValue(
      makeSupabaseMock({ user: { id: "u1" }, selectError: new Error("boom") }),
    );

    expect(await getHeldIdsForCurrentUser()).toEqual([]);
  });

  it("returns [] when createClient itself throws (e.g. missing env config)", async () => {
    createClient.mockRejectedValue(new Error("no env"));

    expect(await getHeldIdsForCurrentUser()).toEqual([]);
  });
});
