import type { Composio } from "@composio/core";
import type { ConnectorHealth, ConnectorProvider, SyncPage, SyncRequest } from "../provider";

export interface ComposioSyncTransport {
  fetchPage(sdk: Composio, request: SyncRequest): Promise<SyncPage>;
  fetchAclPage(
    sdk: Composio,
    request: Pick<SyncRequest, "tenantId" | "connectionId" | "cursor" | "limit">,
  ): Promise<SyncPage>;
  getHealth(sdk: Composio, connectionId: string): Promise<ConnectorHealth>;
}

/**
 * The SDK boundary is deliberately tiny: every Composio-specific call stays in this folder,
 * while ingestion consumes only ConnectorProvider.
 */
export class ComposioConnectorProvider implements ConnectorProvider {
  readonly kind = "composio" as const;

  constructor(
    private readonly sdk: Composio,
    private readonly transport: ComposioSyncTransport,
  ) {}

  sync(request: SyncRequest): Promise<SyncPage> {
    return this.transport.fetchPage(this.sdk, request);
  }

  refreshAcl(
    request: Pick<SyncRequest, "tenantId" | "connectionId" | "cursor" | "limit">,
  ): Promise<SyncPage> {
    return this.transport.fetchAclPage(this.sdk, request);
  }

  health(connectionId: string): Promise<ConnectorHealth> {
    return this.transport.getHealth(this.sdk, connectionId);
  }
}
