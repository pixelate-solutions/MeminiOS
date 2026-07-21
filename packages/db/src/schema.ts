import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1536)",
  toDriver: (value) => `[${value.join(",")}]`,
  fromDriver: (value) => value.slice(1, -1).split(",").filter(Boolean).map(Number),
});

export const regionEnum = pgEnum("region", ["us", "eu"]);
export const principalTypeEnum = pgEnum("principal_type", ["human", "agent"]);
export const roleEnum = pgEnum("role", ["admin", "steward", "member", "agent"]);
export const connectorStatusEnum = pgEnum("connector_status", [
  "healthy",
  "degraded",
  "disconnected",
]);
export const signalTypeEnum = pgEnum("signal_type", [
  "commitment_open",
  "knowledge_stale",
  "customer_risk",
  "duplicate_work",
  "next_action",
]);
export const signalSeverityEnum = pgEnum("signal_severity", [
  "critical",
  "attention",
  "watch",
  "positive",
]);
export const signalStateEnum = pgEnum("signal_state", [
  "new",
  "acknowledged",
  "resolved",
  "dismissed",
]);
export const skillStateEnum = pgEnum("skill_state", [
  "proposed",
  "in_review",
  "approved",
  "retired",
]);
export const trustLevelEnum = pgEnum("trust_level", [
  "reference",
  "draft_for_approval",
  "autonomous",
]);
export const jobStateEnum = pgEnum("job_state", [
  "queued",
  "running",
  "completed",
  "failed",
  "dead_letter",
]);

const tenantColumn = () => uuid("tenant_id").notNull();
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const tenants = pgTable("tenants", {
  tenantId: uuid("tenant_id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  region: regionEnum("region").notNull(),
  encryptedDek: text("encrypted_dek"),
  kmsKeyReference: text("kms_key_reference"),
  ...timestamps,
});

export const principals = pgTable(
  "principals",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    externalId: text("external_id").notNull(),
    type: principalTypeEnum("type").notNull(),
    role: roleEnum("role").notNull(),
    displayName: text("display_name").notNull(),
    email: text("email"),
    delegatedPrincipalId: uuid("delegated_principal_id"),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("principals_tenant_external_unique").on(table.tenantId, table.externalId),
  ],
);

export const groups = pgTable(
  "groups",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("groups_tenant_external_unique").on(table.tenantId, table.externalId),
  ],
);

export const groupMemberships = pgTable(
  "group_memberships",
  {
    tenantId: tenantColumn(),
    groupId: uuid("group_id").notNull(),
    principalId: uuid("principal_id").notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.groupId, table.principalId] })],
);

export const connectors = pgTable(
  "connectors",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    provider: text("provider").notNull(),
    externalConnectionId: text("external_connection_id").notNull(),
    status: connectorStatusEnum("status").notNull(),
    encryptedSecretRef: text("encrypted_secret_ref").notNull(),
    cursor: jsonb("cursor").$type<Record<string, unknown>>(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    error: text("error"),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.id] })],
);

export const sourceRecords = pgTable(
  "source_records",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    connectorId: uuid("connector_id"),
    sourceSystem: text("source_system").notNull(),
    externalId: text("external_id").notNull(),
    permalink: text("permalink").notNull(),
    title: text("title").notNull(),
    authorExternalId: text("author_external_id"),
    authorName: text("author_name"),
    sourceCreatedAt: timestamp("source_created_at", { withTimezone: true }).notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }).notNull(),
    rawContentHash: text("raw_content_hash").notNull(),
    objectKey: text("object_key"),
    sanitizedContent: text("sanitized_content").notNull(),
    aclSnapshot: jsonb("acl_snapshot").$type<{ public: boolean; capturedAt: string }>().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
    injectionFlags: jsonb("injection_flags").$type<readonly string[]>().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("source_records_external_unique").on(
      table.tenantId,
      table.sourceSystem,
      table.externalId,
    ),
    index("source_records_search_idx").on(table.tenantId, table.sourceUpdatedAt),
  ],
);

export const sourceAcl = pgTable(
  "source_acl",
  {
    tenantId: tenantColumn(),
    sourceRecordId: uuid("source_record_id").notNull(),
    principalId: uuid("principal_id"),
    groupId: uuid("group_id"),
    permission: text("permission").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("source_acl_lookup_idx").on(
      table.tenantId,
      table.sourceRecordId,
      table.principalId,
      table.groupId,
    ),
  ],
);

export const entities = pgTable(
  "entities",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    type: text("type").notNull(),
    canonicalName: text("canonical_name").notNull(),
    summary: text("summary"),
    confidence: real("confidence").notNull(),
    mergedIntoId: uuid("merged_into_id"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    index("entities_name_idx").on(table.tenantId, table.canonicalName),
  ],
);

export const entityAliases = pgTable(
  "entity_aliases",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    entityId: uuid("entity_id").notNull(),
    alias: text("alias").notNull(),
    sourceSystem: text("source_system"),
    confidence: real("confidence").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("entity_aliases_unique").on(table.tenantId, table.alias, table.sourceSystem),
  ],
);

export const edges = pgTable(
  "edges",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    sourceEntityId: uuid("source_entity_id").notNull(),
    targetEntityId: uuid("target_entity_id").notNull(),
    type: text("type").notNull(),
    evidenceSourceIds: uuid("evidence_source_ids").array().notNull(),
    confidence: real("confidence").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
    extractedAt: timestamp("extracted_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    index("edges_source_idx").on(table.tenantId, table.sourceEntityId, table.type),
    index("edges_target_idx").on(table.tenantId, table.targetEntityId, table.type),
  ],
);

export const facts = pgTable(
  "facts",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    subjectEntityId: uuid("subject_entity_id").notNull(),
    predicate: text("predicate").notNull(),
    value: jsonb("value").$type<Record<string, unknown>>().notNull(),
    sourceRecordId: uuid("source_record_id").notNull(),
    confidence: real("confidence").notNull(),
    extractedAt: timestamp("extracted_at", { withTimezone: true }).defaultNow().notNull(),
    staleAt: timestamp("stale_at", { withTimezone: true }),
    supersededById: uuid("superseded_by_id"),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    index("facts_subject_idx").on(table.tenantId, table.subjectEntityId),
  ],
);

export const chunks = pgTable(
  "chunks",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    sourceRecordId: uuid("source_record_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    content: text("content").notNull(),
    contentTsv: customType<{ data: string }>({ dataType: () => "tsvector" })("content_tsv"),
    embedding: vector("embedding"),
    tokenCount: integer("token_count").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("chunks_source_ordinal_unique").on(
      table.tenantId,
      table.sourceRecordId,
      table.ordinal,
    ),
    index("chunks_source_idx").on(table.tenantId, table.sourceRecordId),
  ],
);

export const signals = pgTable(
  "signals",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    detectorId: text("detector_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    type: signalTypeEnum("type").notNull(),
    severity: signalSeverityEnum("severity").notNull(),
    state: signalStateEnum("state").notNull(),
    headline: text("headline").notNull(),
    summary: text("summary").notNull(),
    rationale: text("rationale").notNull(),
    evidenceSourceIds: uuid("evidence_source_ids").array().notNull(),
    affectedEntityIds: uuid("affected_entity_ids").array().notNull(),
    suggestedAction: jsonb("suggested_action").$type<Record<string, unknown>>().notNull(),
    confidence: real("confidence").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("signals_fingerprint_unique").on(table.tenantId, table.fingerprint),
    index("signals_feed_idx").on(table.tenantId, table.state, table.occurredAt),
  ],
);

export const signalFeedback = pgTable(
  "signal_feedback",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    signalId: uuid("signal_id").notNull(),
    principalId: uuid("principal_id").notNull(),
    useful: boolean("useful"),
    reason: text("reason"),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.id] })],
);

export const skills = pgTable(
  "skills",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    ownerPrincipalId: uuid("owner_principal_id").notNull(),
    state: skillStateEnum("state").notNull(),
    trustLevel: trustLevelEnum("trust_level").notNull(),
    currentVersion: integer("current_version").notNull(),
    provenanceSourceIds: uuid("provenance_source_ids").array().notNull(),
    accessScope: jsonb("access_scope").$type<Record<string, unknown>>().notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("skills_slug_unique").on(table.tenantId, table.slug),
  ],
);

export const skillVersions = pgTable(
  "skill_versions",
  {
    tenantId: tenantColumn(),
    skillId: uuid("skill_id").notNull(),
    version: integer("version").notNull(),
    schema: jsonb("schema").$type<Record<string, unknown>>().notNull(),
    markdown: text("markdown").notNull(),
    changeSummary: text("change_summary").notNull(),
    createdByPrincipalId: uuid("created_by_principal_id").notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.skillId, table.version] })],
);

export const skillApprovals = pgTable(
  "skill_approvals",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    skillId: uuid("skill_id").notNull(),
    version: integer("version").notNull(),
    principalId: uuid("principal_id").notNull(),
    role: roleEnum("role").notNull(),
    decision: text("decision").notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.id] })],
);

export const governedDefinitions = pgTable(
  "governed_definitions",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    term: text("term").notNull(),
    version: integer("version").notNull(),
    formula: text("formula").notNull(),
    ownerPrincipalId: uuid("owner_principal_id").notNull(),
    state: skillStateEnum("state").notNull(),
    sourceRecordIds: uuid("source_record_ids").array().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("definitions_term_version_unique").on(table.tenantId, table.term, table.version),
  ],
);

export const modelUsage = pgTable(
  "model_usage",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    principalId: uuid("principal_id").notNull(),
    callClass: text("call_class").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    replayed: boolean("replayed").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    index("model_usage_tenant_time_idx").on(table.tenantId, table.createdAt),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    queue: text("queue").notNull(),
    kind: text("kind").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    state: jobStateEnum("state").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    checkpoint: jsonb("checkpoint").$type<Record<string, unknown>>(),
    error: text("error"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    uniqueIndex("jobs_idempotency_unique").on(table.tenantId, table.idempotencyKey),
    index("jobs_queue_state_idx").on(table.queue, table.state, table.scheduledAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    tenantId: tenantColumn(),
    id: uuid("id").defaultRandom().notNull(),
    principalId: uuid("principal_id").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceIds: uuid("resource_ids").array().notNull(),
    queryHash: text("query_hash"),
    evidenceIds: uuid("evidence_ids").array().notNull(),
    requestId: text("request_id").notNull(),
    ipHash: text("ip_hash"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.id] }),
    index("audit_tenant_time_idx").on(table.tenantId, table.createdAt),
  ],
);
