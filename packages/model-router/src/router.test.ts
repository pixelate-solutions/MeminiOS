import { describe, expect, it, vi } from "vitest";
import { MemoryCassetteStore, ModelRouter, type MeteringSink } from "./index";

const request = {
  tenantId: "t1",
  principalId: "p1",
  callClass: "synthesize" as const,
  prompt: "question",
  maxOutputTokens: 500,
  temperature: 0,
  idempotencyKey: "answer-1",
};

describe("model router", () => {
  it("replays deterministic cassettes and meters the call", async () => {
    const record = vi.fn();
    const metering: MeteringSink = { record };
    const router = new ModelRouter(
      [],
      {
        allowedProviders: ["anthropic"],
        routes: {
          extract: [],
          enrich: [],
          synthesize: [{ provider: "anthropic", model: "test-model" }],
          interview: [],
          signal: [],
        },
        monthlyTokenBudget: 10_000,
        usedTokens: 0,
        zeroRetentionRequired: true,
      },
      metering,
      new MemoryCassetteStore({
        "t1:synthesize:answer-1": {
          text: "cited answer",
          model: "test-model",
          usage: { input: 20, output: 8 },
        },
      }),
      "replay",
    );
    const result = await router.complete(request);
    expect(result.replayed).toBe(true);
    expect(result.text).toBe("cited answer");
    expect(record).toHaveBeenCalledOnce();
  });

  it("rejects model use for deterministic extraction", async () => {
    const router = new ModelRouter(
      [],
      {
        allowedProviders: [],
        routes: { extract: [], enrich: [], synthesize: [], interview: [], signal: [] },
        monthlyTokenBudget: 1,
        usedTokens: 0,
        zeroRetentionRequired: true,
      },
      { record: async () => undefined },
      new MemoryCassetteStore(),
      "replay",
    );
    await expect(router.complete({ ...request, callClass: "extract" })).rejects.toThrow(
      /deterministic/,
    );
  });
});
