import { describe, expect, it } from "vitest";
import { NativeSlackProvider, type SlackTransport } from "./slack/provider";

describe("connector boundary", () => {
  it("preserves resumable cursors", async () => {
    const transport: SlackTransport = {
      history: async () => ({ messages: [], nextCursor: "next-42" }),
      acl: async () => ({ items: [] }),
      health: async () => ({
        status: "healthy",
        checkedAt: new Date().toISOString(),
        message: "ok",
      }),
    };
    const page = await new NativeSlackProvider(transport).sync({
      tenantId: "t1",
      connectionId: "c1",
      mode: "backfill",
      limit: 100,
    });
    expect(page.complete).toBe(false);
    expect(page.cursor?.value).toBe("next-42");
  });
});
