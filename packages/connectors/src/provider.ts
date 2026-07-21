export type ConnectorKind = "slack" | "google-drive" | "composio";
export type SyncMode = "backfill" | "incremental" | "acl";

export interface SourceAclSnapshot {
  public: boolean;
  principalExternalIds: readonly string[];
  groupExternalIds: readonly string[];
  capturedAt: string;
}

export interface ConnectorItem {
  externalId: string;
  sourceSystem: string;
  title: string;
  rawContent: string;
  permalink: string;
  authorExternalId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  mimeType: string;
  acl: SourceAclSnapshot;
  metadata: Readonly<Record<string, string | number | boolean | null>>;
}

export interface ConnectorCursor {
  value: string;
  updatedAt: string;
}

export interface SyncRequest {
  tenantId: string;
  connectionId: string;
  mode: SyncMode;
  cursor?: ConnectorCursor;
  limit: number;
}

export interface SyncPage {
  items: readonly ConnectorItem[];
  cursor?: ConnectorCursor;
  complete: boolean;
  retryAfterMs?: number;
}

export interface ConnectorHealth {
  status: "healthy" | "degraded" | "disconnected";
  checkedAt: string;
  message: string;
}

export interface ConnectorProvider {
  readonly kind: ConnectorKind;
  sync(request: SyncRequest): Promise<SyncPage>;
  refreshAcl(
    request: Pick<SyncRequest, "tenantId" | "connectionId" | "cursor" | "limit">,
  ): Promise<SyncPage>;
  health(connectionId: string): Promise<ConnectorHealth>;
}
