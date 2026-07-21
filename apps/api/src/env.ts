import type { TenantContext } from "@meminios/shared";

export interface Env {
  APP_ORIGIN: string;
  DEV_AUTH_ENABLED: string;
  DATABASE_ENDPOINT: string;
  OBJECT_STORE_ENDPOINT: string;
  QUEUE_ENDPOINT: string;
  KMS_ENDPOINT: string;
  INGEST_QUEUE: Queue;
  ENRICH_QUEUE: Queue;
  SIGNAL_QUEUE: Queue;
  DREAM_QUEUE: Queue;
  OBJECTS: R2Bucket;
  CONFIG_KV: KVNamespace;
  TENANT_REALTIME: DurableObjectNamespace;
}

export interface Variables {
  tenant: TenantContext;
  requestId: string;
}
