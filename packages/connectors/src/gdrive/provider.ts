import type {
  ConnectorHealth,
  ConnectorItem,
  ConnectorProvider,
  SyncPage,
  SyncRequest,
} from "../provider";

export interface GoogleDriveTransport {
  changes(
    connectionId: string,
    pageToken: string | undefined,
    limit: number,
  ): Promise<{
    files: readonly ConnectorItem[];
    nextPageToken?: string;
  }>;
  permissions(
    connectionId: string,
    pageToken: string | undefined,
    limit: number,
  ): Promise<{
    files: readonly ConnectorItem[];
    nextPageToken?: string;
  }>;
  health(connectionId: string): Promise<ConnectorHealth>;
}

export class NativeGoogleDriveProvider implements ConnectorProvider {
  readonly kind = "google-drive" as const;
  constructor(private readonly transport: GoogleDriveTransport) {}

  private page(files: readonly ConnectorItem[], nextPageToken: string | undefined): SyncPage {
    return {
      items: files,
      complete: !nextPageToken,
      ...(nextPageToken
        ? { cursor: { value: nextPageToken, updatedAt: new Date().toISOString() } }
        : {}),
    };
  }

  async sync(request: SyncRequest): Promise<SyncPage> {
    const result = await this.transport.changes(
      request.connectionId,
      request.cursor?.value,
      request.limit,
    );
    return this.page(result.files, result.nextPageToken);
  }

  async refreshAcl(
    request: Pick<SyncRequest, "tenantId" | "connectionId" | "cursor" | "limit">,
  ): Promise<SyncPage> {
    const result = await this.transport.permissions(
      request.connectionId,
      request.cursor?.value,
      request.limit,
    );
    return this.page(result.files, result.nextPageToken);
  }

  health(connectionId: string): Promise<ConnectorHealth> {
    return this.transport.health(connectionId);
  }
}
