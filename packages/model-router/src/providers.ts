import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { ModelProvider, ModelRequest, ProviderResponse } from "./types";

export class OpenAiProvider implements ModelProvider {
  readonly kind: "openai" | "openai-compatible";
  private readonly client: OpenAI;

  constructor(options: { apiKey: string; baseURL?: string; compatible?: boolean }) {
    this.kind = options.compatible ? "openai-compatible" : "openai";
    this.client = new OpenAI({
      apiKey: options.apiKey,
      ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    });
  }

  async complete(request: ModelRequest, model: string): Promise<ProviderResponse> {
    const response = await this.client.responses.create({
      model,
      ...(request.system ? { instructions: request.system } : {}),
      input: request.prompt,
      max_output_tokens: request.maxOutputTokens,
      temperature: request.temperature,
    });
    return {
      text: response.output_text,
      model,
      usage: {
        input: response.usage?.input_tokens ?? 0,
        output: response.usage?.output_tokens ?? 0,
      },
    };
  }
}

export class AnthropicProvider implements ModelProvider {
  readonly kind = "anthropic" as const;
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(request: ModelRequest, model: string): Promise<ProviderResponse> {
    const response = await this.client.messages.create({
      model,
      max_tokens: request.maxOutputTokens,
      temperature: request.temperature,
      ...(request.system ? { system: request.system } : {}),
      messages: [{ role: "user", content: request.prompt }],
    });
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return {
      text,
      model,
      usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    };
  }
}

export class GoogleProvider implements ModelProvider {
  readonly kind = "google" as const;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async complete(request: ModelRequest, model: string): Promise<ProviderResponse> {
    const response = await this.client.models.generateContent({
      model,
      contents: request.prompt,
      config: {
        ...(request.system ? { systemInstruction: request.system } : {}),
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
      },
    });
    return {
      text: response.text ?? "",
      model,
      usage: {
        input: response.usageMetadata?.promptTokenCount ?? 0,
        output: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}
