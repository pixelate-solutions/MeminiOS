import type {
  CassetteStore,
  MeteringSink,
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ProviderKind,
  TenantModelPolicy,
} from "./types";

export type RouterMode = "live" | "record" | "replay";

export class ModelRouter {
  private readonly providers: ReadonlyMap<ProviderKind, ModelProvider>;

  constructor(
    providers: readonly ModelProvider[],
    private readonly policy: TenantModelPolicy,
    private readonly metering: MeteringSink,
    private readonly cassettes: CassetteStore,
    private readonly mode: RouterMode = "replay",
  ) {
    this.providers = new Map(providers.map((provider) => [provider.kind, provider]));
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    if (request.callClass === "extract") {
      throw new Error(
        "Synchronous extraction must be deterministic; model-router rejects extract calls on the write path.",
      );
    }
    if (this.policy.usedTokens >= this.policy.monthlyTokenBudget) {
      throw new Error("Tenant model budget exhausted");
    }
    const routes = this.policy.routes[request.callClass].filter((route) =>
      this.policy.allowedProviders.includes(route.provider),
    );
    if (!routes.length) throw new Error(`No allowed route for ${request.callClass}`);

    const cassetteKey = `${request.tenantId}:${request.callClass}:${request.idempotencyKey}`;
    if (this.mode !== "live") {
      const replay = await this.cassettes.read(cassetteKey);
      if (replay)
        return this.finalize(request, replay, true, 0, routes[0]?.provider ?? "openai-compatible");
      if (this.mode === "replay") throw new Error(`Missing model cassette: ${cassetteKey}`);
    }

    const errors: Error[] = [];
    for (const route of routes) {
      const provider = this.providers.get(route.provider);
      if (!provider) {
        errors.push(new Error(`Provider ${route.provider} is not configured`));
        continue;
      }
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const startedAt = performance.now();
        try {
          const response = await provider.complete(request, route.model);
          const latencyMs = Math.round(performance.now() - startedAt);
          if (this.mode === "record") await this.cassettes.write(cassetteKey, response);
          return this.finalize(request, response, false, latencyMs, provider.kind);
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
    throw new AggregateError(errors, `All model routes failed for ${request.callClass}`);
  }

  private async finalize(
    request: ModelRequest,
    response: { text: string; model: string; usage: { input: number; output: number } },
    replayed: boolean,
    latencyMs: number,
    provider: ProviderKind,
  ): Promise<ModelResponse> {
    await this.metering.record({
      tenantId: request.tenantId,
      principalId: request.principalId,
      callClass: request.callClass,
      provider,
      model: response.model,
      usage: response.usage,
      latencyMs,
      replayed,
    });
    return { ...response, provider, latencyMs, replayed };
  }
}

export class MemoryCassetteStore implements CassetteStore {
  private readonly entries = new Map<
    string,
    { text: string; model: string; usage: { input: number; output: number } }
  >();

  constructor(
    initial: Readonly<
      Record<string, { text: string; model: string; usage: { input: number; output: number } }>
    > = {},
  ) {
    Object.entries(initial).forEach(([key, value]) => this.entries.set(key, value));
  }

  async read(key: string) {
    return this.entries.get(key) ?? null;
  }

  async write(
    key: string,
    response: { text: string; model: string; usage: { input: number; output: number } },
  ) {
    this.entries.set(key, response);
  }
}
