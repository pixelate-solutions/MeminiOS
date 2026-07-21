import { bootstrapSchema, type Bootstrap } from "@meminios/shared";
import { demoBootstrap } from "@meminios/shared/demo";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function fetchBootstrap(): Promise<Bootstrap> {
  try {
    const response = await fetch(`${API_URL}/api/bootstrap`, {
      headers: { "x-meminios-dev-principal": demoBootstrap.viewer.id },
    });
    if (!response.ok) {
      throw new Error(`Bootstrap failed with ${response.status}`);
    }
    return bootstrapSchema.parse(await response.json());
  } catch {
    return demoBootstrap;
  }
}

export async function sendSignalFeedback(
  signalId: string,
  state: "acknowledged" | "resolved" | "dismissed",
  reason?: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/signals/${signalId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-meminios-dev-principal": demoBootstrap.viewer.id,
      },
      body: JSON.stringify({ state, reason }),
    });
  } catch {
    // The local product remains interactive when the edge API is not running.
  }
}
