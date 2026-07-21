export type ModelCallClass = "extract" | "enrich" | "synthesize" | "interview" | "signal";
export type ProviderKind = "anthropic" | "openai" | "google" | "openai-compatible";

export interface ModelRequest {
  tenantId: string;
  principalId: string;
  callClass: ModelCallClass;
  prompt: string;
  system?: string;
  maxOutputTokens: number;
  temperature: number;
  idempotencyKey: string;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface ModelResponse {
  text: string;
  provider: ProviderKind;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  replayed: boolean;
}

export interface ProviderResponse {
  text: string;
  model: string;
  usage: TokenUsage;
}

export interface ModelProvider {
  readonly kind: ProviderKind;
  complete(request: ModelRequest, model: string): Promise<ProviderResponse>;
}

export interface ModelRoute {
  provider: ProviderKind;
  model: string;
}

export interface TenantModelPolicy {
  allowedProviders: readonly ProviderKind[];
  routes: Readonly<Record<ModelCallClass, readonly ModelRoute[]>>;
  monthlyTokenBudget: number;
  usedTokens: number;
  zeroRetentionRequired: boolean;
}

export interface MeteringSink {
  record(entry: {
    tenantId: string;
    principalId: string;
    callClass: ModelCallClass;
    provider: ProviderKind;
    model: string;
    usage: TokenUsage;
    latencyMs: number;
    replayed: boolean;
  }): Promise<void>;
}

export interface CassetteStore {
  read(key: string): Promise<ProviderResponse | null>;
  write(key: string, response: ProviderResponse): Promise<void>;
}
