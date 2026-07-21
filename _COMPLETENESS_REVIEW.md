# Completeness Review: AIFuneralHomeOperationsManager

- **Review date:** 2026-07-18
- **Assessment basis:** Static source and configuration inspection only. Dependencies were not installed, and no build, database migration, external integration, or runtime workflow was executed.

## Classification

**Prototype-demo**

## Verdict

The repository presents a broad death-care operations surface (18 source files and 13 route modules), but static evidence is characteristic of a generated prototype. Pages and endpoints demonstrate concepts; they do not establish a verified execution path to manage cases, authorizations, schedules, remains identity, merchandise, documents, services, billing, and aftercare.

## Why it is not complete

- 20 files are explicitly named as gap/gap-feature implementations; route/page count therefore overstates completed product capability.
- The route/page inventory includes `backlog`, `multi state permit auto filer`, `preneed conversion agent`; these surfaces show breadth but not durable execution against authoritative systems.
- 13 files reference model-provider or chat-completion behavior; generic LLM calls are not a substitute for deterministic domain execution, grounding, or evaluation.
- 22 files contain mock, sample, placeholder, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- No recognizable application test files were found in the inspected tree.
- No CI workflow was found to continuously verify builds, tests, migrations, or security checks.
- No environment example/template was found, so required configuration and secret boundaries are undocumented.

## Needed features

- 1. Implement a workflow to manage cases, authorizations, schedules, remains identity, merchandise, documents, services, billing, and aftercare.
- 2. Connect vital records, cemetery maps, inventory, payments, e-signature, obituary/publishing, and accounting; replace seed/demo records with durable synchronized data and explicit failure handling.
- 3. Validate identity chain, scheduling, pricing disclosures, document completeness, inventory, and financial reconciliation.
- 4. Preserve dignity/privacy and chain of custody, version jurisdiction rules, and require licensed staff approval.
- 5. Add contract, integration, authorization, migration, and end-to-end tests in CI, plus a documented non-destructive deployment/run path.

## Risks or launch blockers

- Credential/secret fallback or demo-password pattern occurs in 1 file and must be removed or made development-only.
- The root launcher can terminate unrelated processes occupying configured ports.
- The root launcher seeds, creates, migrates, or otherwise mutates database state during startup.
- The root launcher installs dependencies at run time, reducing reproducibility and expanding supply-chain risk.
- Ungrounded or malformed model output can become a domain action unless schemas, evidence, evaluations, and approval gates are added.

## Evidence inspected

- `package.json` — declared scripts, runtime dependencies, and application boundaries.
- `public/js/app.js` — service composition, middleware, and registered routes.
- `server/index.js` — service composition, middleware, and registered routes.
- `server/routes/backlog.js` — implemented API surface and domain/AI request handling.
- `server/routes/multiStatePermitAutoFiler.js` — implemented API surface and domain/AI request handling.
- `server/routes/preneedConversionAgent.js` — implemented API surface and domain/AI request handling.

## Recommended next action

Treat this as a prototype: use backlog and multi state permit auto filer to select one narrow death-care operations outcome, quarantine generated gap routes, and implement that outcome end to end with real data, deterministic rules, and tests before adding features.

## Implementation progress

- **Needed feature 1 — locally implemented governed core:** `server/domain/caseWorkflow.js`, `server/routes/governedCases.js`, and `server/migrations/001_governed_cases.sql` add a tenant-scoped intake → identity verified → authorized → scheduled → in service → disposition complete → aftercare → close workflow. Cases retain jurisdiction/rule versions, pricing disclosure, schedule state, authorizations and financial reconciliation. Witnessed, idempotent remains-identity events form a durable chain; optimistic versions prevent lost transitions.
- **Needed feature 2 — locally implemented boundary; externally blocked adapters:** vital-record, cemetery, inventory, payment, e-signature, publishing and accounting operations have a durable queued/succeeded/failed/manual-review record with external references and error details. Real execution remains blocked on vendor credentials, agreements, source schemas, verified webhooks and certified environments.
- **Needed features 3–4 — locally implemented governance:** identity events validate tag/type/location/witness; authorization records require versioned, checksummed storage evidence; identity, authorization and reconciliation gate lifecycle transitions; licensed-director/manager/admin authority gates regulated actions; tenant scope and immutable before/after audit events protect accountability. Jurisdiction rules, document completeness policy, chain-of-custody SOPs, pricing disclosures, privacy/retention and licensed-professional acceptance remain mandatory external gates.
- **Needed feature 5 and launch blockers — implemented:** generated gap endpoints are no longer mounted, startup schema mutation is disabled, the AI key is optional for non-AI operations, JWT/production DB configuration is fail-closed, and the destructive launcher was replaced. `.env.example`, non-destructive start, separate bootstrap/migration/guarded destructive-demo-seed, operations guidance, PostgreSQL CI and tests were added. The focused suite passes 3/3 tests and changed JavaScript/shell syntax checks pass.
- **Remaining external gates:** the legacy baseline schema still needs controlled provisioning before additive migrations; no vital-record/payment/e-signature/provider, licensed director, legal/regulatory, privacy, production migration, browser end-to-end, or real chain-of-custody validation was executed or claimed complete.
