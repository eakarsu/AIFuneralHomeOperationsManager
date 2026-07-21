CREATE TABLE IF NOT EXISTS governed_cases (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, legacy_case_id BIGINT, case_reference TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'intake',
  jurisdiction TEXT NOT NULL, rule_version TEXT NOT NULL, identity_verified BOOLEAN NOT NULL DEFAULT false, authorization_complete BOOLEAN NOT NULL DEFAULT false,
  pricing_disclosure JSONB NOT NULL DEFAULT '{}'::jsonb, financial_reconciled BOOLEAN NOT NULL DEFAULT false, created_by BIGINT NOT NULL,
  approved_by BIGINT, version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,case_reference), CONSTRAINT governed_case_stage CHECK(status IN ('intake','identity_verified','authorized','scheduled','in_service','disposition_complete','aftercare','closed'))
);
CREATE TABLE IF NOT EXISTS identity_chain_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, governed_case_id BIGINT NOT NULL REFERENCES governed_cases(id), identity_tag TEXT NOT NULL,
  event_type TEXT NOT NULL, location TEXT NOT NULL, witness_user_id BIGINT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL, notes TEXT,
  idempotency_key TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS case_authorizations (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, governed_case_id BIGINT NOT NULL REFERENCES governed_cases(id), authorization_type TEXT NOT NULL,
  version TEXT NOT NULL, storage_reference TEXT NOT NULL, checksum TEXT NOT NULL, signed_by TEXT NOT NULL, witnessed_by BIGINT NOT NULL,
  approved_by BIGINT, approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS deathcare_integration_runs (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, provider TEXT NOT NULL, operation TEXT NOT NULL, status TEXT NOT NULL,
  external_reference TEXT, error_code TEXT, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT deathcare_integration_status CHECK(status IN ('queued','succeeded','failed','manual_review'))
);
CREATE TABLE IF NOT EXISTS deathcare_audit_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, actor_user_id BIGINT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  before_state JSONB, after_state JSONB, request_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS governed_case_tenant_status_idx ON governed_cases(tenant_id,status);
