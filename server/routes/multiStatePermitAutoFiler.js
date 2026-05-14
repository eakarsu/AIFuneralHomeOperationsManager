// Multi-state permit auto-filer that orchestrates state-permit and
// cremation-registry stubs into one workflow.
// Audit: batch_04.md / AIFuneralHomeOperationsManager / Custom Feature Suggestions #4
// TODO: configure credentials STATE_PERMIT_API_KEY, CREMATION_REGISTRY_API_KEY
const express = require('express');

function register(app, deps) {
  const { authMiddleware, db } = deps;
  const router = express.Router();
  router.use(authMiddleware);

  async function callAI(systemPrompt, userMessage) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI Funeral Home - Permit Auto-Filer'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 3000
      })
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error.message || 'AI failed');
    return data.choices[0].message.content;
  }

  function parseJSON(text) {
    try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {}
    return { notes: text };
  }

  // POST /api/permit-autofiler/orchestrate
  router.post('/orchestrate', async (req, res) => {
    try {
      const { case_id, decedent_state, disposition_state, disposition_type, cause_of_death } = req.body || {};
      if (!case_id) return res.status(400).json({ error: 'case_id required' });

      const credsStatus = {
        state_permit_api: !!process.env.STATE_PERMIT_API_KEY,
        cremation_registry_api: !!process.env.CREMATION_REGISTRY_API_KEY,
        transport_api: !!process.env.TRANSPORT_API_KEY
      };

      let caseRow = null;
      try {
        const r = await db.query(`SELECT * FROM cases WHERE id = $1`, [case_id]);
        caseRow = r.rows[0] || null;
      } catch (_) {}

      const systemPrompt = `You are a multi-state funeral-permit orchestrator. Given a case (decedent state,
disposition state, disposition type), produce a sequenced plan of permits to file (death cert, burial-transit,
cremation authorization, out-of-state shipping, disinterment), required documents per step, and which
external API (or fallback manual filing) handles each step. Return STRICT JSON only.`;

      const userPrompt = `Case: ${case_id}
Decedent state: ${decedent_state || caseRow?.decedent_state || 'unspecified'}
Disposition state: ${disposition_state || caseRow?.disposition_state || decedent_state || 'unspecified'}
Disposition type: ${disposition_type || caseRow?.disposition_type || 'unspecified'}
Cause of death: ${cause_of_death || caseRow?.cause_of_death || 'unspecified'}
Credentials status: ${JSON.stringify(credsStatus)}

Return JSON:
{
  "summary": "...",
  "filing_plan": [
    {
      "step": 1,
      "permit_type": "death_certificate|burial_transit|cremation_auth|out_of_state_shipping|disinterment",
      "jurisdiction": "string",
      "required_documents": ["..."],
      "estimated_turnaround_days": 0,
      "api_handler": "state_permit_api|cremation_registry_api|manual",
      "fallback_if_unconfigured": "string"
    }
  ],
  "blockers": ["..."],
  "warnings": ["..."],
  "next_human_actions": ["..."],
  "credentials_status": ${JSON.stringify(credsStatus)},
  "disclaimer": "Compliance summary only; verify with state vital records and your funeral director."
}`;

      const raw = await callAI(systemPrompt, userPrompt);
      const parsed = parseJSON(raw);

      try {
        await db.query(
          `INSERT INTO ai_history (user_id, feature, payload, created_at)
           VALUES ($1, 'permit_autofiler', $2, NOW())`,
          [req.user?.id || null, JSON.stringify({ case_id, plan: parsed })]
        ).catch(() => {});
      } catch (_) {}

      res.json({ case_id, credentials: credsStatus, plan: parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/permit-autofiler/status
  router.get('/status', (_req, res) => {
    res.json({
      state_permit_api: !!process.env.STATE_PERMIT_API_KEY,
      cremation_registry_api: !!process.env.CREMATION_REGISTRY_API_KEY,
      transport_api: !!process.env.TRANSPORT_API_KEY,
      smtp: !!process.env.SMTP_HOST,
      twilio: !!process.env.TWILIO_ACCOUNT_SID
    });
  });

  app.use('/api/permit-autofiler', router);
}

module.exports = { register };
