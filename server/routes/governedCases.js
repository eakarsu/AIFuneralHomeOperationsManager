const express = require('express');
const crypto = require('crypto');
const { validateIdentityEvent, validateTransition } = require('../domain/caseWorkflow');

module.exports = ({ db, authMiddleware }) => {
  const router = express.Router();
  router.use(authMiddleware);
  const tenant = (req) => String(req.user.organization_id || req.user.tenant_id || `personal-${req.user.id}`);

  router.get('/', async (req, res, next) => {
    try { const result = await db.query('SELECT * FROM governed_cases WHERE tenant_id=$1 ORDER BY created_at DESC', [tenant(req)]); res.json(result.rows); } catch (error) { next(error); }
  });

  router.post('/', async (req, res) => {
    const client = await db.pool.connect();
    try {
      for (const field of ['case_reference','jurisdiction','rule_version']) if (!req.body[field]) throw new Error(`${field} is required`);
      await client.query('BEGIN');
      const result = await client.query(`INSERT INTO governed_cases(tenant_id,legacy_case_id,case_reference,jurisdiction,rule_version,pricing_disclosure,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [tenant(req), req.body.legacy_case_id || null, req.body.case_reference, req.body.jurisdiction, req.body.rule_version, JSON.stringify(req.body.pricing_disclosure || {}), req.user.id]);
      await client.query('INSERT INTO deathcare_audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [tenant(req), req.user.id, 'case.created', 'governed_case', String(result.rows[0].id), result.rows[0], req.get('x-request-id') || crypto.randomUUID()]);
      await client.query('COMMIT'); res.status(201).json(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); res.status(400).json({ error: error.message }); } finally { client.release(); }
  });

  router.post('/:id/identity-events', async (req, res) => {
    const client = await db.pool.connect();
    try {
      const key = req.get('idempotency-key'); if (!key) throw new Error('Idempotency-Key header is required');
      const event = validateIdentityEvent({ ...req.body, case_id: req.params.id, witness_user_id: req.body.witness_user_id || req.user.id });
      await client.query('BEGIN');
      const found = await client.query('SELECT id FROM governed_cases WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, tenant(req)]);
      if (!found.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'case not found' }); }
      const result = await client.query(`INSERT INTO identity_chain_events(tenant_id,governed_case_id,identity_tag,event_type,location,witness_user_id,occurred_at,notes,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`, [tenant(req), req.params.id, event.identity_tag, event.event_type, event.location, event.witness_user_id, event.occurred_at, event.notes || null, key]);
      if (event.event_type === 'verified') await client.query('UPDATE governed_cases SET identity_verified=true,updated_at=NOW() WHERE id=$1 AND tenant_id=$2', [req.params.id, tenant(req)]);
      await client.query('INSERT INTO deathcare_audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [tenant(req), req.user.id, 'identity.event_recorded', 'governed_case', String(req.params.id), result.rows[0], req.get('x-request-id') || crypto.randomUUID()]);
      await client.query('COMMIT'); res.status(201).json(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); res.status(400).json({ error: error.message }); } finally { client.release(); }
  });

  router.post('/:id/authorizations', async (req, res) => {
    try {
      for (const field of ['authorization_type','version','storage_reference','checksum','signed_by']) if (!req.body[field]) throw new Error(`${field} is required`);
      if (!/^[a-f0-9]{64}$/i.test(req.body.checksum)) throw new Error('checksum must be SHA-256');
      const result = await db.query(`INSERT INTO case_authorizations(tenant_id,governed_case_id,authorization_type,version,storage_reference,checksum,signed_by,witnessed_by) SELECT $1,id,$2,$3,$4,$5,$6,$7 FROM governed_cases WHERE id=$8 AND tenant_id=$1 RETURNING *`, [tenant(req), req.body.authorization_type, req.body.version, req.body.storage_reference, req.body.checksum, req.body.signed_by, req.user.id, req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'case not found' }); res.status(201).json(result.rows[0]);
    } catch (error) { res.status(400).json({ error: error.message }); }
  });

  router.post('/:id/transition', async (req, res) => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query(`SELECT c.*,COUNT(a.id)::int AS authorization_count FROM governed_cases c LEFT JOIN case_authorizations a ON a.governed_case_id=c.id AND a.tenant_id=c.tenant_id WHERE c.id=$1 AND c.tenant_id=$2 GROUP BY c.id FOR UPDATE OF c`, [req.params.id, tenant(req)]);
      const item = found.rows[0]; if (!item) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'case not found' }); }
      const authorizationComplete = item.authorization_complete || item.authorization_count > 0;
      validateTransition(item.status, req.body.status, { role: req.user.role, identityVerified: item.identity_verified, authorizationComplete, financialReconciled: req.body.financial_reconciled || item.financial_reconciled });
      const result = await client.query(`UPDATE governed_cases SET status=$1,authorization_complete=$2,financial_reconciled=COALESCE($3,financial_reconciled),approved_by=CASE WHEN $1 IN ('authorized','disposition_complete','closed') THEN $4 ELSE approved_by END,version=version+1,updated_at=NOW() WHERE id=$5 AND tenant_id=$6 AND version=$7 RETURNING *`, [req.body.status, authorizationComplete, req.body.financial_reconciled, req.user.id, item.id, tenant(req), Number(req.body.version)]);
      if (!result.rows[0]) throw new Error('version conflict');
      await client.query('INSERT INTO deathcare_audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_state,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [tenant(req), req.user.id, 'case.transitioned', 'governed_case', String(item.id), item, result.rows[0], req.get('x-request-id') || crypto.randomUUID()]);
      await client.query('COMMIT'); res.json(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); res.status(409).json({ error: error.message }); } finally { client.release(); }
  });

  router.post('/integration-runs', async (req, res, next) => {
    try {
      if (!req.body.provider || !req.body.operation || !['queued','succeeded','failed','manual_review'].includes(req.body.status)) return res.status(400).json({ error: 'provider, operation, and valid status required' });
      if (req.body.status === 'failed' && !req.body.error_code) return res.status(400).json({ error: 'error_code required' });
      const result = await db.query('INSERT INTO deathcare_integration_runs(tenant_id,provider,operation,status,external_reference,error_code,error_message) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', [tenant(req), req.body.provider, req.body.operation, req.body.status, req.body.external_reference || null, req.body.error_code || null, req.body.error_message || null]); res.status(201).json(result.rows[0]);
    } catch (error) { next(error); }
  });
  return router;
};
