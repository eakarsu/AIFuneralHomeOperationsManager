/**
 * Apply pass 5 — backlog implementation for AIFuneralHomeOperationsManager.
 *
 * This file is additive: it exports a factory `register(app, deps)` that
 * mounts new routes onto the existing monolith without touching any of its
 * 30+ existing handlers. The monolith's `authMiddleware` and `db` are passed
 * in by `server/index.js`.
 *
 * Categories implemented:
 *   - NEEDS-CREDS (HTTP 503 + missing-env contract):
 *       POST /api/integrations/notifications/email          (SMTP_HOST)
 *       POST /api/integrations/notifications/sms            (TWILIO_ACCOUNT_SID)
 *       POST /api/integrations/cremation-registry/lookup    (CREMATION_REGISTRY_API_KEY)
 *       POST /api/integrations/transport-provider/quote     (TRANSPORT_API_KEY)
 *       POST /api/integrations/state-permit/lookup          (STATE_PERMIT_API_KEY)
 *   - NEEDS-PRODUCT-DECISION:
 *       Vendor directory (CRUD on additive `vendors` table; default categories).
 *       Family portal token (one-shot signed URL using JWT_SECRET; default scope = read-only).
 *   - MECHANICAL extension of probate flow:
 *       POST /api/probate/checklist  → returns standard probate checklist by jurisdiction.
 *
 * All schema additions use CREATE TABLE IF NOT EXISTS — safe to run repeatedly.
 */
const express = require('express');
const jwt = require('jsonwebtoken');

function need(envVar, res, friendly) {
  if (!process.env[envVar]) {
    res.status(503).json({ error: `${friendly} not configured`, missing: envVar });
    return false;
  }
  return true;
}

// PRODUCT-DECISION: probate steps below reflect a generic US baseline. Each
// state has its own quirks; we expose `state_code` so the model can adjust.
const PROBATE_BASE_CHECKLIST = [
  { step: 1, name: 'File petition with probate court', estimated_days: 14 },
  { step: 2, name: 'Notice to creditors and beneficiaries', estimated_days: 30 },
  { step: 3, name: 'Inventory of estate assets', estimated_days: 60 },
  { step: 4, name: 'Pay valid debts and taxes', estimated_days: 90 },
  { step: 5, name: 'Distribute remaining assets', estimated_days: 120 },
  { step: 6, name: 'Final accounting and case closure', estimated_days: 180 },
];

async function ensureSchema(db) {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notification_log_v5 (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        channel VARCHAR(32),
        recipient TEXT,
        subject TEXT,
        body TEXT,
        status VARCHAR(32) DEFAULT 'queued',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS vendors_v5 (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS family_portal_tokens_v5 (
        id SERIAL PRIMARY KEY,
        case_id INTEGER,
        token_hash TEXT NOT NULL,
        scope TEXT DEFAULT 'read-only',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.warn('[apply5/backlog] ensureSchema soft-fail:', err.message);
  }
}

/**
 * @param {import('express').Express} app
 * @param {{authMiddleware: Function, db: any}} deps
 */
function register(app, deps) {
  const { authMiddleware, db } = deps;
  ensureSchema(db);

  const router = express.Router();
  router.use(authMiddleware);

  // ----- Notifications --------------------------------------------------
  router.post('/integrations/notifications/email', async (req, res) => {
    if (!need('SMTP_HOST', res, 'SMTP email provider')) return;
    const { to, subject, body } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });
    try {
      await db.query(
        `INSERT INTO notification_log_v5 (user_id, channel, recipient, subject, body, status)
         VALUES ($1,'email',$2,$3,$4,'queued_stub')`,
        [req.user?.id || null, to, subject, body || '']
      );
    } catch (_) {}
    res.json({ status: 'queued', provider: 'smtp', note: 'stub — outbound delivery requires nodemailer dep' });
  });

  router.post('/integrations/notifications/sms', async (req, res) => {
    if (!need('TWILIO_ACCOUNT_SID', res, 'Twilio SMS')) return;
    const { to, body } = req.body || {};
    if (!to || !body) return res.status(400).json({ error: 'to and body are required' });
    try {
      await db.query(
        `INSERT INTO notification_log_v5 (user_id, channel, recipient, body, status)
         VALUES ($1,'sms',$2,$3,'queued_stub')`,
        [req.user?.id || null, to, body]
      );
    } catch (_) {}
    res.json({ status: 'queued', provider: 'twilio', note: 'stub — outbound requires twilio dep' });
  });

  // ----- External integrations -----------------------------------------
  router.post('/integrations/cremation-registry/lookup', async (req, res) => {
    if (!need('CREMATION_REGISTRY_API_KEY', res, 'Cremation registry')) return;
    res.json({ found: 0, results: [], note: 'stub — wire to provider when configured' });
  });

  router.post('/integrations/transport-provider/quote', async (req, res) => {
    if (!need('TRANSPORT_API_KEY', res, 'Transport provider')) return;
    res.json({ quote: null, note: 'stub — wire to provider' });
  });

  router.post('/integrations/state-permit/lookup', async (req, res) => {
    if (!need('STATE_PERMIT_API_KEY', res, 'State permit lookup')) return;
    res.json({ permits: [], note: 'stub — wire to state provider' });
  });

  // ----- Vendor directory (PRODUCT-DECISION default) -------------------
  // PRODUCT-DECISION: minimal CRUD with category enum kept open-string for
  // flexibility; recommended values: florist, caterer, musician, transport,
  // grave-marker, officiant, custodian.
  // Note: existing monolith already has /api/vendors with a richer schema —
  // we mount under /api/vendor-directory to avoid conflicts.
  router.get('/vendor-directory', async (req, res) => {
    try {
      const r = await db.query(
        `SELECT id, name, category, contact_email, contact_phone, active, created_at
         FROM vendors_v5 ORDER BY id DESC LIMIT 200`
      );
      res.json({ data: r.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/vendor-directory', async (req, res) => {
    const { name, category, contact_email, contact_phone, notes } = req.body || {};
    if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
    try {
      const r = await db.query(
        `INSERT INTO vendors_v5 (name, category, contact_email, contact_phone, notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, name, category, active, created_at`,
        [name, category, contact_email || null, contact_phone || null, notes || null]
      );
      res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ----- Family portal: signed token (PRODUCT-DECISION) ---------------
  // PRODUCT-DECISION: single-purpose, time-boxed (default 7 days), read-only.
  // Reuses JWT_SECRET — the family/customer-facing portal app would verify
  // the token and limit access to the case.
  router.post('/family-portal/issue-token', async (req, res) => {
    const { case_id, scope, days } = req.body || {};
    if (!case_id) return res.status(400).json({ error: 'case_id is required' });
    const expiresInDays = Number.isFinite(+days) && +days > 0 && +days <= 90 ? +days : 7;
    const tokenScope = scope || 'read-only';
    try {
      const token = jwt.sign(
        { case_id: +case_id, scope: tokenScope, t: 'family-portal' },
        process.env.JWT_SECRET,
        { expiresIn: `${expiresInDays}d` }
      );
      const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + expiresInDays * 86400 * 1000);
      try {
        await db.query(
          `INSERT INTO family_portal_tokens_v5 (case_id, token_hash, scope, expires_at)
           VALUES ($1,$2,$3,$4)`,
          [+case_id, tokenHash, tokenScope, expiresAt]
        );
      } catch (_) {}
      res.json({
        token,
        scope: tokenScope,
        expires_at: expiresAt.toISOString(),
        portal_url_template: `https://example.com/family-portal?token=${token}`,
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ----- Probate checklist (MECHANICAL) -------------------------------
  router.post('/probate/checklist', async (req, res) => {
    const { case_id, state_code } = req.body || {};
    res.json({
      case_id: case_id || null,
      state_code: state_code || 'US-GENERIC',
      checklist: PROBATE_BASE_CHECKLIST,
      note: 'PRODUCT-DECISION: jurisdiction-specific tweaks should be layered on top via /api/ai/permit-checklist',
    });
  });

  app.use('/api', router);
}

module.exports = { register };
