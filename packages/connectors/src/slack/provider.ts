import type {
  ConnectorHealth,
  ConnectorItem,
  ConnectorProvider,
  SyncPage,
  SyncRequest,
} from "../provider";

export interface SlackTransport {
  history(
    connectionId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{
    messages: readonly ConnectorItem[];
    nextCursor?: string;
  }>;
  acl(
    connectionId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{
    items: readonly ConnectorItem[];
    nextCursor?: string;
  }>;
  health(connectionId: string): Promise<ConnectorHealth>;
}

export class NativeSlackProvider implements ConnectorProvider {
  readonly kind = "slack" as const;
  constructor(private readonly transport: SlackTransport) {}

  async sync(request: SyncRequest): Promise<SyncPage> {
    const page = await this.transport.history(
      request.connectionId,
      request.cursor?.value,
      request.limit,
    );
    return {
      items: page.messages,
      complete: !page.nextCursor,
      ...(page.nextCursor
        ? { cursor: { value: page.nextCursor, updatedAt: new Date().toISOString() } }
        : {}),
    };
  }

  async refreshAcl(
    request: Pick<SyncRequest, "tenantId" | "connectionId" | "cursor" | "limit">,
  ): Promise<SyncPage> {
    const page = await this.transport.acl(
      request.connectionId,
      request.cursor?.value,
      request.limit,
    );
    return {
      items: page.items,
      complete: !page.nextCursor,
      ...(page.nextCursor
        ? { cursor: { value: page.nextCursor, updatedAt: new Date().toISOString() } }
        : {}),
    };
  }

  health(connectionId: string): Promise<ConnectorHealth> {
    return this.transport.health(connectionId);
  }
}
