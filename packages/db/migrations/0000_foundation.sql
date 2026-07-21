BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN CREATE TYPE region AS ENUM ('us', 'eu'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE principal_type AS ENUM ('human', 'agent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE role AS ENUM ('admin', 'steward', 'member', 'agent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE connector_status AS ENUM ('healthy', 'degraded', 'disconnected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE signal_type AS ENUM ('commitment_open', 'knowledge_stale', 'customer_risk', 'duplicate_work', 'next_action'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE signal_severity AS ENUM ('critical', 'attention', 'watch', 'positive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE signal_state AS ENUM ('new', 'acknowledged', 'resolved', 'dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE skill_state AS ENUM ('proposed', 'in_review', 'approved', 'retired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trust_level AS ENUM ('reference', 'draft_for_approval', 'autonomous'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_state AS ENUM ('queued', 'running', 'completed', 'failed', 'dead_letter'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tenants (
  tenant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region region NOT NULL,
  encrypted_dek text,
  kms_key_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS principals (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  type principal_type NOT NULL,
  role role NOT NULL,
  display_name text NOT NULL,
  email text,
  delegated_principal_id uuid,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, external_id)
);

CREATE TABLE IF NOT EXISTS groups (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, external_id)
);

CREATE TABLE IF NOT EXISTS group_memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  group_id uuid NOT NULL,
  principal_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, group_id, principal_id),
  FOREIGN KEY (tenant_id, group_id) REFERENCES groups(tenant_id, id),
  FOREIGN KEY (tenant_id, principal_id) REFERENCES principals(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS connectors (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_connection_id text NOT NULL,
  status connector_status NOT NULL,
  encrypted_secret_ref text NOT NULL,
  cursor jsonb,
  last_synced_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS source_records (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid,
  source_system text NOT NULL,
  external_id text NOT NULL,
  permalink text NOT NULL,
  title text NOT NULL,
  author_external_id text,
  author_name text,
  source_created_at timestamptz NOT NULL,
  source_updated_at timestamptz NOT NULL,
  raw_content_hash text NOT NULL,
  object_key text,
  sanitized_content text NOT NULL,
  acl_snapshot jsonb NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  injection_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, source_system, external_id),
  FOREIGN KEY (tenant_id, connector_id) REFERENCES connectors(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS source_acl (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  source_record_id uuid NOT NULL,
  principal_id uuid,
  group_id uuid,
  permission text NOT NULL CHECK (permission IN ('read', 'write', 'owner')),
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (principal_id IS NOT NULL OR group_id IS NOT NULL),
  FOREIGN KEY (tenant_id, source_record_id) REFERENCES source_records(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entities (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  canonical_name text NOT NULL,
  summary text,
  confidence real NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  merged_into_id uuid,
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS entity_aliases (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  alias text NOT NULL,
  source_system text,
  confidence real NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, entity_id) REFERENCES entities(tenant_id, id),
  UNIQUE (tenant_id, alias, source_system)
);

CREATE TABLE IF NOT EXISTS edges (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_entity_id uuid NOT NULL,
  target_entity_id uuid NOT NULL,
  type text NOT NULL,
  evidence_source_ids uuid[] NOT NULL CHECK (cardinality(evidence_source_ids) > 0),
  confidence real NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  valid_from timestamptz,
  valid_to timestamptz,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, source_entity_id) REFERENCES entities(tenant_id, id),
  FOREIGN KEY (tenant_id, target_entity_id) REFERENCES entities(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS facts (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_entity_id uuid NOT NULL,
  predicate text NOT NULL,
  value jsonb NOT NULL,
  source_record_id uuid NOT NULL,
  confidence real NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  extracted_at timestamptz NOT NULL DEFAULT now(),
  stale_at timestamptz,
  superseded_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, subject_entity_id) REFERENCES entities(tenant_id, id),
  FOREIGN KEY (tenant_id, source_record_id) REFERENCES source_records(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS chunks (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL,
  ordinal integer NOT NULL,
  content text NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  embedding vector(1536),
  token_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, source_record_id) REFERENCES source_records(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, source_record_id, ordinal)
);

CREATE TABLE IF NOT EXISTS signals (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  detector_id text NOT NULL,
  fingerprint text NOT NULL,
  type signal_type NOT NULL,
  severity signal_severity NOT NULL,
  state signal_state NOT NULL DEFAULT 'new',
  headline text NOT NULL,
  summary text NOT NULL,
  rationale text NOT NULL,
  evidence_source_ids uuid[] NOT NULL CHECK (cardinality(evidence_source_ids) > 0),
  affected_entity_ids uuid[] NOT NULL DEFAULT '{}',
  suggested_action jsonb NOT NULL,
  confidence real NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  occurred_at timestamptz NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS signal_feedback (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL,
  principal_id uuid NOT NULL,
  useful boolean,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, signal_id) REFERENCES signals(tenant_id, id),
  FOREIGN KEY (tenant_id, principal_id) REFERENCES principals(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS skills (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  owner_principal_id uuid NOT NULL,
  state skill_state NOT NULL,
  trust_level trust_level NOT NULL,
  current_version integer NOT NULL CHECK (current_version > 0),
  provenance_source_ids uuid[] NOT NULL CHECK (cardinality(provenance_source_ids) > 0),
  access_scope jsonb NOT NULL,
  last_verified_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, owner_principal_id) REFERENCES principals(tenant_id, id),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS skill_versions (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  skill_id uuid NOT NULL,
  version integer NOT NULL,
  schema jsonb NOT NULL,
  markdown text NOT NULL,
  change_summary text NOT NULL,
  created_by_principal_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, skill_id, version),
  FOREIGN KEY (tenant_id, skill_id) REFERENCES skills(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS skill_approvals (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL,
  version integer NOT NULL,
  principal_id uuid NOT NULL,
  role role NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'changes_requested', 'rejected')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, skill_id, version) REFERENCES skill_versions(tenant_id, skill_id, version)
);

CREATE TABLE IF NOT EXISTS governed_definitions (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  term text NOT NULL,
  version integer NOT NULL,
  formula text NOT NULL,
  owner_principal_id uuid NOT NULL,
  state skill_state NOT NULL,
  source_record_ids uuid[] NOT NULL CHECK (cardinality(source_record_ids) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, term, version)
);

CREATE TABLE IF NOT EXISTS model_usage (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL,
  call_class text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  latency_ms integer NOT NULL,
  replayed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS jobs (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  queue text NOT NULL,
  kind text NOT NULL,
  idempotency_key text NOT NULL,
  state job_state NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  checkpoint jsonb,
  error text,
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_ids uuid[] NOT NULL DEFAULT '{}',
  query_hash text,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  request_id text NOT NULL,
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS source_records_search_idx ON source_records (tenant_id, source_updated_at DESC);
CREATE INDEX IF NOT EXISTS source_acl_lookup_idx ON source_acl (tenant_id, source_record_id, principal_id, group_id);
CREATE INDEX IF NOT EXISTS entities_name_idx ON entities (tenant_id, lower(canonical_name));
CREATE INDEX IF NOT EXISTS edges_source_idx ON edges (tenant_id, source_entity_id, type);
CREATE INDEX IF NOT EXISTS edges_target_idx ON edges (tenant_id, target_entity_id, type);
CREATE INDEX IF NOT EXISTS facts_subject_idx ON facts (tenant_id, subject_entity_id);
CREATE INDEX IF NOT EXISTS chunks_content_tsv_idx ON chunks USING gin (content_tsv);
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS signals_feed_idx ON signals (tenant_id, state, occurred_at DESC);
CREATE INDEX IF NOT EXISTS jobs_queue_state_idx ON jobs (queue, state, scheduled_at);
CREATE INDEX IF NOT EXISTS audit_tenant_time_idx ON audit_logs (tenant_id, created_at DESC);

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.current_principal_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.principal_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.current_role() RETURNS text
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.role', true), '') $$;

CREATE OR REPLACE FUNCTION app.can_read_source(requested_source_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM source_records sr
    WHERE sr.tenant_id = app.current_tenant_id()
      AND sr.id = requested_source_id
      AND (
        coalesce((sr.acl_snapshot ->> 'public')::boolean, false)
        OR EXISTS (
          SELECT 1 FROM source_acl sa
          WHERE sa.tenant_id = sr.tenant_id
            AND sa.source_record_id = sr.id
            AND sa.principal_id = app.current_principal_id()
            AND sa.permission IN ('read', 'write', 'owner')
        )
        OR EXISTS (
          SELECT 1
          FROM source_acl sa
          JOIN group_memberships gm
            ON gm.tenant_id = sa.tenant_id
           AND gm.group_id = sa.group_id
          WHERE sa.tenant_id = sr.tenant_id
            AND sa.source_record_id = sr.id
            AND gm.principal_id = app.current_principal_id()
            AND sa.permission IN ('read', 'write', 'owner')
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION app.can_read_sources(requested_source_ids uuid[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT cardinality(requested_source_ids) > 0
    AND NOT EXISTS (
      SELECT 1 FROM unnest(requested_source_ids) source_id
      WHERE NOT app.can_read_source(source_id)
    )
$$;

CREATE OR REPLACE FUNCTION app.can_read_entity(requested_entity_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM facts f
    WHERE f.tenant_id = app.current_tenant_id()
      AND f.subject_entity_id = requested_entity_id
      AND app.can_read_source(f.source_record_id)
  ) OR EXISTS (
    SELECT 1 FROM edges e
    WHERE e.tenant_id = app.current_tenant_id()
      AND (e.source_entity_id = requested_entity_id OR e.target_entity_id = requested_entity_id)
      AND app.can_read_sources(e.evidence_source_ids)
  )
$$;

DO $$ BEGIN CREATE ROLE meminios_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public, app TO meminios_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO meminios_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO meminios_runtime;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO meminios_runtime;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'tenants','principals','groups','group_memberships','connectors','source_records','source_acl',
    'entities','entity_aliases','edges','facts','chunks','signals','signal_feedback','skills',
    'skill_versions','skill_approvals','governed_definitions','model_usage','jobs','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants FOR ALL TO meminios_runtime
  USING (tenant_id = app.current_tenant_id()) WITH CHECK (tenant_id = app.current_tenant_id());

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['principals','groups','group_memberships'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I FOR ALL TO meminios_runtime USING (tenant_id = app.current_tenant_id()) WITH CHECK (tenant_id = app.current_tenant_id())', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS connector_admin ON connectors;
CREATE POLICY connector_admin ON connectors FOR ALL TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS source_records_read ON source_records;
DROP POLICY IF EXISTS source_records_insert ON source_records;
CREATE POLICY source_records_read ON source_records FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_source(id));
CREATE POLICY source_records_insert ON source_records FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS source_acl_admin ON source_acl;
CREATE POLICY source_acl_admin ON source_acl FOR ALL TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS entities_read ON entities;
DROP POLICY IF EXISTS entities_write ON entities;
DROP POLICY IF EXISTS entities_insert ON entities;
CREATE POLICY entities_read ON entities FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_entity(id));
CREATE POLICY entities_insert ON entities FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY entities_write ON entities FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS aliases_read ON entity_aliases;
DROP POLICY IF EXISTS aliases_write ON entity_aliases;
DROP POLICY IF EXISTS aliases_insert ON entity_aliases;
CREATE POLICY aliases_read ON entity_aliases FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_entity(entity_id));
CREATE POLICY aliases_insert ON entity_aliases FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY aliases_write ON entity_aliases FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS edges_read ON edges;
DROP POLICY IF EXISTS edges_write ON edges;
DROP POLICY IF EXISTS edges_insert ON edges;
CREATE POLICY edges_read ON edges FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_sources(evidence_source_ids));
CREATE POLICY edges_insert ON edges FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY edges_write ON edges FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS facts_read ON facts;
DROP POLICY IF EXISTS facts_write ON facts;
DROP POLICY IF EXISTS facts_insert ON facts;
CREATE POLICY facts_read ON facts FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_source(source_record_id));
CREATE POLICY facts_insert ON facts FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY facts_write ON facts FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS chunks_read ON chunks;
DROP POLICY IF EXISTS chunks_write ON chunks;
DROP POLICY IF EXISTS chunks_insert ON chunks;
CREATE POLICY chunks_read ON chunks FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_source(source_record_id));
CREATE POLICY chunks_insert ON chunks FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY chunks_write ON chunks FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS signals_read ON signals;
DROP POLICY IF EXISTS signals_write ON signals;
DROP POLICY IF EXISTS signals_insert ON signals;
CREATE POLICY signals_read ON signals FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_sources(evidence_source_ids));
CREATE POLICY signals_insert ON signals FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY signals_write ON signals FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

DROP POLICY IF EXISTS feedback_own ON signal_feedback;
CREATE POLICY feedback_own ON signal_feedback FOR ALL TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND (principal_id = app.current_principal_id() OR app.current_role() IN ('admin', 'steward')))
  WITH CHECK (tenant_id = app.current_tenant_id() AND principal_id = app.current_principal_id());

DROP POLICY IF EXISTS skills_read ON skills;
DROP POLICY IF EXISTS skills_write ON skills;
DROP POLICY IF EXISTS skills_insert ON skills;
CREATE POLICY skills_read ON skills FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_sources(provenance_source_ids));
CREATE POLICY skills_insert ON skills FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY skills_write ON skills FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['skill_versions','skill_approvals'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS skill_steward ON %I', table_name);
    EXECUTE format('CREATE POLICY skill_steward ON %I FOR ALL TO meminios_runtime USING (tenant_id = app.current_tenant_id() AND app.current_role() IN (''admin'', ''steward'')) WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN (''admin'', ''steward''))', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS definitions_read ON governed_definitions;
DROP POLICY IF EXISTS definitions_write ON governed_definitions;
DROP POLICY IF EXISTS definitions_insert ON governed_definitions;
CREATE POLICY definitions_read ON governed_definitions FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.can_read_sources(source_record_ids));
CREATE POLICY definitions_insert ON governed_definitions FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));
CREATE POLICY definitions_write ON governed_definitions FOR UPDATE TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS model_usage_scope ON model_usage;
CREATE POLICY model_usage_scope ON model_usage FOR ALL TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND (principal_id = app.current_principal_id() OR app.current_role() = 'admin'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND principal_id = app.current_principal_id());

DROP POLICY IF EXISTS jobs_admin ON jobs;
CREATE POLICY jobs_admin ON jobs FOR ALL TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'))
  WITH CHECK (tenant_id = app.current_tenant_id() AND app.current_role() IN ('admin', 'steward'));

DROP POLICY IF EXISTS audit_read ON audit_logs;
DROP POLICY IF EXISTS audit_insert ON audit_logs;
CREATE POLICY audit_read ON audit_logs FOR SELECT TO meminios_runtime
  USING (tenant_id = app.current_tenant_id() AND (principal_id = app.current_principal_id() OR app.current_role() = 'admin'));
CREATE POLICY audit_insert ON audit_logs FOR INSERT TO meminios_runtime
  WITH CHECK (tenant_id = app.current_tenant_id() AND principal_id = app.current_principal_id());

COMMIT;
