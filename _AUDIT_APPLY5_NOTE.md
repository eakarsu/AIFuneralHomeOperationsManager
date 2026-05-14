# Apply Pass 5 — AIFuneralHomeOperationsManager

- **Date:** 2026-05-08
- **Stack:** Express monolith (`server/index.js` ~1493 LOC) + static HTML/JS in `public/`. JWT bearer (`authMiddleware`); shared `db`. No React.
- **Audit source:** `_AUDIT/reports/batch_04.md` #6 (skeleton per audit — materially out of date).

## Verified present (no new work)

- `server/index.js` already has 30+ routes inline + 12 AI endpoints (pass 1-4): analyze, generate-obituary, compliance-check, grief-recommendation, pricing-estimate, embalming-report, aftercare-email, preneed-conversion-summary, grief-stage-classifier, permit-checklist, preneed-at-risk, memorial-upsell.
- Pass 5 added `server/routes/backlog.js` (registered via `register(app, deps)` factory at server/index.js line 1473) with 9 endpoints across 3 categories:
  - **NEEDS-CREDS:** `/api/integrations/notifications/email` (SMTP_HOST), `/sms` (TWILIO_ACCOUNT_SID), `/cremation-registry/lookup` (CREMATION_REGISTRY_API_KEY), `/transport-provider/quote` (TRANSPORT_API_KEY), `/state-permit/lookup` (STATE_PERMIT_API_KEY).
  - **PRODUCT-DECISION:** `/api/vendor-directory` GET/POST, `/api/family-portal/issue-token` (signed URL with JWT_SECRET).
  - **MECHANICAL:** `/api/probate/checklist` (jurisdiction-aware checklist).
- All schema additions use `CREATE TABLE IF NOT EXISTS`.
- Static FE in `public/js/app.js` already covers vendor CRUD via the resource catalog (line 469); other backlog endpoints (probate/checklist, family-portal token, integrations) are not yet surfaced in the static FE.

## Implemented (this pass)

None — backlog.js already implements 9 items (above cap). FE coverage gap acknowledged but not filled (the static `public/js/app.js` is a single 1.3k-LOC resource catalog that doesn't have a routing system; adding the new endpoints would require restructuring or a parallel mini-page — flagged below).

## Deferred

| Item | Category | Reason |
|------|----------|--------|
| FE surface for `/api/probate/checklist`, `/api/integrations/*`, `/api/family-portal/issue-token` | NEEDS-PRODUCT-DECISION | Static `public/js/app.js` lacks a routing/page system; product decision needed (extend resource catalog vs. separate page vs. introduce SPA). |
| Live SMTP / Twilio sends | NEEDS-CREDS | All five integrations stub 503 with `missing` env. |
| State permit / cremation registry lookups | NEEDS-CREDS | Jurisdiction-by-jurisdiction; no national API exists. |
| Refactor monolith into routes/ | TOO-RISKY | 30+ existing handlers; defer until product owner approves. |
| Memorial video / posthumous message delivery | NEEDS-PRODUCT-DECISION | Custom feature suggestions; needs spec + media infrastructure. |

## Smoke test

- `node --check server/index.js` PASS.
- `node --check server/routes/backlog.js` PASS.
- Live HTTP smoke: skipped (existing `_AUDIT_NOTE.md` documents prior live tests against the monolith).

## Notes

Pass 5 backend already exceeded cap (9 items). FE coverage of backlog endpoints documented as a NEEDS-PRODUCT-DECISION gap because the public/js architecture isn't a route-based SPA.
