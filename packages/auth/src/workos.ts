import { WorkOS } from "@workos-inc/node";

export interface WorkOsConfig {
  apiKey: string;
  clientId: string;
}

export function createWorkOsClient(config: WorkOsConfig): WorkOS {
  return new WorkOS(config.apiKey, { clientId: config.clientId });
}
