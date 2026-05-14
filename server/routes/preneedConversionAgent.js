// Pre-need conversion agent recommending product mix and contact cadence
// by family financial profile.
// Audit: batch_04.md / AIFuneralHomeOperationsManager / Custom Feature Suggestions #2
const express = require('express');
const jwt = require('jsonwebtoken');

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
        'X-Title': 'AI Funeral Home - Pre-need Conversion'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.4,
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

  // POST /api/preneed-conversion/recommend
  router.post('/recommend', async (req, res) => {
    try {
      const {
        family_id,
        contact_name,
        age,
        income_band, // low|middle|upper-middle|high
        family_size,
        religion,
        prior_arrangement,
        preferences = {}
      } = req.body || {};

      let priorCases = { rows: [] };
      try {
        priorCases = await db.query(
          `SELECT id, family_name, total_amount, service_type, created_at
           FROM cases WHERE family_id = $1 ORDER BY created_at DESC LIMIT 5`,
          [family_id || null]
        );
      } catch (_) {}

      const systemPrompt = `You are a compassionate pre-need (advance funeral planning) conversion advisor.
Recommend a product mix (casket/urn tier, service type, memorial extras, transportation, payment plan) and a
contact cadence (calls, mailings, in-person) appropriate for the family's profile. Tone: warm, never pushy.
Return STRICT JSON only.`;

      const userPrompt = `Family contact: ${contact_name || 'unspecified'}
Age: ${age || 'unspecified'}
Income band: ${income_band || 'unspecified'}
Family size: ${family_size || 'unspecified'}
Religion / cultural preference: ${religion || 'unspecified'}
Prior arrangement on file: ${prior_arrangement ? 'yes' : 'no'}
Stated preferences: ${JSON.stringify(preferences)}
Prior cases for this family: ${JSON.stringify(priorCases.rows)}

Return JSON:
{
  "summary": "...",
  "recommended_package": {
    "service_type": "traditional|cremation|memorial_only|graveside|direct_cremation",
    "casket_or_urn_tier": "economy|standard|premium",
    "memorial_extras": ["..."],
    "transportation": "string",
    "estimated_total_usd": 0
  },
  "payment_plans": [{ "plan": "string", "monthly_usd": 0, "term_months": 0, "rationale": "string" }],
  "contact_cadence": [{ "day_offset": 0, "channel": "call|email|mail|in_person", "talking_points": ["..."] }],
  "objection_handling": [{ "concern": "string", "compassionate_response": "string" }],
  "compliance_notes": ["..."],
  "disclaimer": "Recommendations only; final arrangements per family wishes."
}`;

      const raw = await callAI(systemPrompt, userPrompt);
      const parsed = parseJSON(raw);
      res.json({ family_id, recommendation: parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/preneed-conversion/at-risk - families with stalled pre-need conversations
  router.get('/at-risk', async (req, res) => {
    try {
      const r = await db.query(
        `SELECT id, family_name, last_contact_at, status FROM preneed_pipeline
         WHERE status IN ('contacted','quoted')
           AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '45 days')
         ORDER BY last_contact_at NULLS FIRST LIMIT 50`
      ).catch(() => ({ rows: [] }));
      res.json(r.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/preneed-conversion', router);
}

module.exports = { register };
