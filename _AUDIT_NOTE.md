# Audit Apply Notes — AIFuneralHomeOperationsManager

Audit source: `_AUDIT/reports/batch_04.md` (#6). Verdict: skeleton (per audit), 0 routes.

## Reality check

Audit is materially out of date. `server/index.js` is a 1,493-line monolith with 30+ active routes including 12+ AI endpoints:
- `/ai/analyze`, `/ai/generate-obituary`, `/ai/compliance-check`, `/ai/grief-recommendation`, `/ai/pricing-estimate`, `/ai/embalming-report`, `/ai/aftercare-email`, `/ai/preneed-conversion-summary`, `/ai/grief-stage-classifier`, `/ai/permit-checklist`, `/ai/preneed-at-risk`, `/ai/memorial-upsell`.
- Generic CRUD factory (`/api/${routePath}`) for many domain entities.
- Dashboard stats, financial reports, calendar events, case pipeline, export endpoints.

The audit's verdict ("Skeleton — backend-only monolithic code with 0 modular routes and 0 AI endpoints") does not match the current code. Substantive but monolithic.

## Implementation applied

No new endpoints were added — the audit's gap list was largely covered. Per the spec, an audit section that is non-actionable becomes a backlog-only note.

## Backlog (prioritized)

### Mechanical (high value)
- Refactor monolithic `server/index.js` (1,493 lines) into a `routes/` directory.
- Add a customer-facing minimal frontend or public API documentation surface (the audit flagged "no frontend").

### Needs creds / external
- State permit/death-record automation (varies by jurisdiction).
- Integrations with cremation registries, transport providers.

### Needs product decision
- Customer/family portal vs. funeral-director-only product.
- Vendor directory (florists, caterers, musicians).

### Custom features (already partial)
- Memorial video generation (existing `memorial-upsell` could feed this).
- Probate assistant — extend existing case-permits flow.
- Posthumous message delivery platform.

## Apply pass 3 (frontend)

- **Stack:** Express + static HTML/JS under `public/` (single `js/app.js`).
- **Action:** LEFT-AS-IS (FE already wired).
- **Verification:** `public/js/app.js` dispatches to all 12 `/api/ai/*` endpoints exposed in the `server/index.js` monolith and sends the JWT bearer header from `localStorage`. Endpoints covered: `analyze`, `generate-obituary`, `compliance-check`, `grief-recommendation`, `pricing-estimate`, `embalming-report`, `aftercare-email`, `preneed-conversion-summary`, `grief-stage-classifier`, `permit-checklist`, `preneed-at-risk`, `memorial-upsell`.
- **Files modified:** none.

## Apply pass 4 (mechanical backlog)

- **Action:** LEFT-AS-IS.
- **Features added:** none.
- **Reason:** The audit's actionable gap list was already covered (12+ AI endpoints). Remaining items map cleanly to existing backlog: monolith refactor (TOO-RISKY — touches working code spanning 1,493 lines / 30+ routes), state-permit / cremation-registry / transport-provider integrations (NEEDS-CREDS), customer-portal vs director-only / vendor directory (NEEDS-PRODUCT-DECISION), memorial video and posthumous message delivery (NEEDS-PRODUCT-DECISION + media infrastructure). Probate-assistant extension is the most plausible mechanical extension but the marginal value vs. risk of editing the monolith kept it below the cap-priority bar; flagged in inferred backlog.
- **Files modified:** none.
