const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuid(value: string, label = "id"): string {
  if (!UUID_V4.test(value)) {
    throw new Error(`${label} must be a UUID v4`);
  }
  return value;
}

export function createId(): string {
  return crypto.randomUUID();
}
