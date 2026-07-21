# Security and operations

Run `scripts/bootstrap.sh`, provision the existing baseline schema in an isolated environment, export `DATABASE_URL`, run `scripts/migrate.sh`, then `./start.sh`. Startup no longer installs dependencies, starts PostgreSQL, creates users/tables, seeds data, kills ports, or exposes demo credentials. The legacy rebuilding seed is guarded and must never target production.

`/api/governed-cases` introduces a tenant-scoped case lifecycle with versioned jurisdiction rules, pricing disclosures, witnessed and idempotent remains-identity chain events, checksummed authorizations, licensed-role approval, optimistic concurrency, financial reconciliation, provider failure records and immutable audit events. Generated gap endpoints are no longer routed. AI features are optional and advisory.

Vital-record, cemetery-map, inventory, payment, e-signature, publishing and accounting connections require vendor agreements and real credentials. Jurisdiction rules, chain-of-custody procedures, pricing disclosures, professional licensure, identity handling, disposition authorization and financial reconciliation require funeral-home counsel and licensed director validation. This code is not itself regulatory or professional approval.
