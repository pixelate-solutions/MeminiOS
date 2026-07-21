import type { TenantContext } from "@meminios/shared";

export interface ScopedConnection {
  unsafe<T extends readonly Record<string, unknown>[] = readonly Record<string, unknown>[]>(
    query: string,
    parameters?: readonly unknown[],
  ): Promise<T>;
}

export interface TransactionalConnection {
  begin<T>(callback: (transaction: ScopedConnection) => Promise<T>): Promise<T>;
}

export async function withTenantContext<T>(
  connection: TransactionalConnection,
  context: TenantContext,
  operation: (transaction: ScopedConnection) => Promise<T>,
): Promise<T> {
  return connection.begin(async (transaction) => {
    await transaction.unsafe(
      "select set_config('app.tenant_id', $1, true), set_config('app.principal_id', $2, true), set_config('app.role', $3, true)",
      [context.tenantId, context.principalId, context.role],
    );
    return operation(transaction);
  });
}
