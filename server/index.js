require('dotenv').config();

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------
if (!process.env.OPENROUTER_API_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY environment variable is not set.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./db');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_casketurn_recommendation_ai_for_famil = require('./routes/gap-no-casketurn-recommendation-ai-for-famil');
const route_gap_no_vendor_performance_scoring_ai = require('./routes/gap-no-vendor-performance-scoring-ai');
const route_gap_no_demand_forecast_for_service_capacity = require('./routes/gap-no-demand-forecast-for-service-capacity');
const route_gap_no_after_care_churn_risk_model = require('./routes/gap-no-after-care-churn-risk-model');
const route_gap_no_real_spa_frontend_public_static = require('./routes/gap-no-real-spa-frontend-public-static');
const route_gap_no_webhook_subscribersdispatchers = require('./routes/gap-no-webhook-subscribersdispatchers');
const route_gap_no_real_smtptwilio_integration_only_need = require('./routes/gap-no-real-smtptwilio-integration-only-need');
const route_gap_no_file_upload_module_for_case = require('./routes/gap-no-file-upload-module-for-case');
const route_gap_no_real_time_chat_with_families = require('./routes/gap-no-real-time-chat-with-families');
const route_gap_no_payment_processing = require('./routes/gap-no-payment-processing');
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
// Helmet — relaxed CSP so the legacy single-file public/index.html can run inline scripts
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS — env-driven allowlist with sensible localhost defaults
const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://localhost:4000,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// AI result persistence + audit log + password reset bootstrap
// ---------------------------------------------------------------------------
async function initExtraTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        tool_name TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        input_snapshot JSONB,
        result JSONB,
        model TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_email TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS case_permits (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        permit_name TEXT NOT NULL,
        jurisdiction TEXT,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        ai_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS embalming_chemical_lots (
        id SERIAL PRIMARY KEY,
        embalming_id INTEGER REFERENCES embalming(id) ON DELETE CASCADE,
        inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
        lot_number TEXT,
        quantity_used NUMERIC(10,2),
        unit TEXT,
        used_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Add password reset / change columns to users if missing
    await db.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('Extra tables (ai_results, audit_log, case_permits, embalming_chemical_lots) initialized');
  } catch (err) {
    console.error('initExtraTables error (non-fatal):', err.message);
  }
}
initExtraTables();

// JWT authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// RBAC middleware — staff can only read, managers can do everything
function managerOnly(req, res, next) {
  if (req.user && req.user.role === 'staff') {
    return res.status(403).json({ error: 'Access denied. Manager role required for this action.' });
  }
  next();
}

// AI rate limiter — 20 requests per hour, keyed by user ID or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------------------
// Audit logging middleware — fires after every successful mutation under /api
// ---------------------------------------------------------------------------
app.use('/api', (req, res, next) => {
  res.on('finish', async () => {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      res.statusCode < 400 &&
      req.user
    ) {
      try {
        const parts = req.path.split('/').filter(Boolean);
        const entityType = parts[0] || null;
        const entityId = parts[1] && /^\d+$/.test(parts[1]) ? parseInt(parts[1]) : null;
        await db.query(
          'INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5,$6)',
          [req.user.id, req.user.email, req.method, entityType, entityId, req.ip]
        );
      } catch (err) {
        console.error('audit_log insert failed:', err.message);
      }
    }
  });
  next();
});

// ---------------------------------------------------------------------------
// OpenRouter AI helper + 3-strategy JSON parser + result persistence
// ---------------------------------------------------------------------------
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

function parseAIJson(text) {
  if (typeof text !== 'string') return text;
  // Strategy 1: direct parse
  try { return JSON.parse(text); } catch (_) {}
  // Strategy 2: strip code-fences
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch (_) {}
  // Strategy 3: locate first/last brace
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {}
  }
  return { raw_response: text };
}

async function saveAiResult(userId, toolName, entityType, entityId, inputSnapshot, result) {
  try {
    await db.query(
      `INSERT INTO ai_results (user_id, tool_name, entity_type, entity_id, input_snapshot, result, model)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        userId || null,
        toolName,
        entityType || null,
        entityId || null,
        JSON.stringify(inputSnapshot || {}),
        typeof result === 'string' ? JSON.stringify({ text: result }) : JSON.stringify(result || {}),
        OPENROUTER_MODEL,
      ]
    );
  } catch (err) {
    console.error('Failed to save AI result:', err.message);
  }
}

async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = OPENROUTER_MODEL;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:4000',
      'X-Title': 'AI Funeral Home Operations Manager',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

const SYSTEM_PROMPT =
  'You are an expert AI assistant for Eternal Haven Funeral Home. You specialize in funeral home operations, regulatory compliance, grief support, and mortuary science. Provide professional, compassionate, and detailed advice.';

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userInfo } = user;
    res.json({ token, user: userInfo });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password — generates a reset token and returns it (for demo).
// In production this token would be emailed to the user.
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always respond with success to avoid user enumeration.
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists, a reset link has been generated.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2, updated_at = NOW() WHERE email = $3',
      [token, expiry, email]
    );
    // Demo mode: return the token so the front-end (or QA) can complete the flow without email plumbing.
    res.json({
      message: 'Reset token issued. Use POST /api/auth/reset-password to complete.',
      reset_token: token,
      expires_at: expiry,
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password — consumes the token issued by /forgot-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) return res.status(400).json({ error: 'token and new_password are required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const result = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });
    const password_hash = await bcrypt.hash(new_password, 10);
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = $2',
      [password_hash, result.rows[0].id]
    );
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password — requires authentication and current password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password are required' });
    }
    if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('change-password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI history — paginated
app.get('/api/ai-history', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      db.query(
        'SELECT id, tool_name, entity_type, entity_id, input_snapshot, result, model, created_at FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user.id, limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM ai_results WHERE user_id = $1', [req.user.id]),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('ai-history error:', err);
    res.status(500).json({ error: 'Failed to load AI history' });
  }
});

// Audit log — paginated, manager-only
app.get('/api/audit-log', authMiddleware, managerOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      db.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM audit_log'),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('audit-log error:', err);
    res.status(500).json({ error: 'Failed to load audit log' });
  }
});

// ---------------------------------------------------------------------------
// Generic CRUD factory
// ---------------------------------------------------------------------------
const resourceConfigs = {
  cases: {
    table: 'cases',
    searchCols: ['deceased_first_name', 'deceased_last_name', 'case_number', 'status'],
  },
  services: {
    table: 'services',
    searchCols: ['service_type', 'location', 'status'],
  },
  compliance: {
    table: 'compliance',
    searchCols: ['state_name', 'requirement_name'],
  },
  pricing: {
    table: 'pricing',
    searchCols: ['item_name', 'item_category'],
  },
  preneed: {
    table: 'preneed',
    searchCols: ['client_first_name', 'client_last_name', 'plan_type'],
  },
  atneed: {
    table: 'atneed',
    searchCols: ['contact_first_name', 'contact_last_name', 'urgency_level'],
  },
  'grief-support': {
    table: 'grief_support',
    searchCols: ['resource_name', 'resource_type'],
  },
  inventory: {
    table: 'inventory',
    searchCols: ['item_name', 'category', 'sku'],
  },
  staff: {
    table: 'staff',
    searchCols: ['first_name', 'last_name', 'role'],
  },
  documents: {
    table: 'documents',
    searchCols: ['document_name', 'document_type'],
  },
  cremation: {
    table: 'cremation',
    searchCols: ['cremation_number', 'status'],
  },
  fleet: {
    table: 'fleet',
    searchCols: ['vehicle_name', 'vehicle_type', 'license_plate'],
  },
  'memorial-products': {
    table: 'memorial_products',
    searchCols: ['product_name', 'category'],
  },
  obituaries: {
    table: 'obituaries',
    searchCols: ['deceased_name', 'status'],
  },
  embalming: {
    table: 'embalming',
    searchCols: ['embalmer_name', 'status'],
  },
  'cemetery-plots': {
    table: 'cemetery_plots',
    searchCols: ['cemetery_name', 'owner_name', 'plot_number'],
  },
  'insurance-claims': {
    table: 'insurance_claims',
    searchCols: ['insurance_company', 'policy_number', 'claim_status'],
  },
  vendors: {
    table: 'vendors',
    searchCols: ['vendor_name', 'vendor_type', 'contact_name'],
  },
  appointments: {
    table: 'appointments',
    searchCols: ['title', 'client_name', 'appointment_type'],
  },
  'financial-records': {
    table: 'financial_records',
    searchCols: ['description', 'payer_name', 'transaction_type'],
  },
  communications: {
    table: 'communications',
    searchCols: ['contact_name', 'subject', 'communication_type'],
  },
  'flower-orders': {
    table: 'flower_orders',
    searchCols: ['sender_name', 'florist_name', 'arrangement_type'],
  },
  'facility-rooms': {
    table: 'facility_rooms',
    searchCols: ['room_name', 'room_type', 'booking_status'],
  },
  aftercare: {
    table: 'aftercare',
    searchCols: ['family_contact_name', 'program_type', 'status'],
  },
};

function registerCrudRoutes(app, routePath, config) {
  const { table, searchCols } = config;

  // GET all (with optional search and pagination)
  app.get(`/api/${routePath}`, authMiddleware, async (req, res) => {
    try {
      const { search } = req.query;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      let baseQuery;
      let countQuery;
      let params = [];

      if (search && searchCols.length > 0) {
        const conditions = searchCols.map(() => `${searchCols[0]}::text ILIKE $1`);
        // Correct: each searchCol uses the same $1 param for ILIKE
        const conditionStr = searchCols.map((col) => `${col}::text ILIKE $1`).join(' OR ');
        baseQuery = `SELECT * FROM ${table} WHERE ${conditionStr} ORDER BY id DESC`;
        countQuery = `SELECT COUNT(*) FROM ${table} WHERE ${conditionStr}`;
        params = [`%${search}%`];
      } else {
        baseQuery = `SELECT * FROM ${table} ORDER BY id DESC`;
        countQuery = `SELECT COUNT(*) FROM ${table}`;
        params = [];
      }

      const paginatedQuery = baseQuery + ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const paginatedParams = [...params, limit, offset];

      const [dataResult, countResult] = await Promise.all([
        db.query(paginatedQuery, paginatedParams),
        db.query(countQuery, params),
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: dataResult.rows,
        pagination: { page, limit, total, totalPages },
      });
    } catch (err) {
      console.error(`GET /${routePath} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET by id
  app.get(`/api/${routePath}/:id`, authMiddleware, async (req, res) => {
    try {
      const result = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`GET /${routePath}/:id error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST create — staff cannot mutate financial-records
  const postMiddlewares = [authMiddleware];
  if (routePath === 'financial-records') postMiddlewares.push(managerOnly);
  app.post(`/api/${routePath}`, ...postMiddlewares, async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      if (fields.length === 0) {
        return res.status(400).json({ error: 'Request body is empty' });
      }
      const columns = fields.join(', ');
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values = fields.map((f) => req.body[f]);

      const result = await db.query(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(`POST /${routePath} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT update — staff cannot mutate financial-records
  const putMiddlewares = [authMiddleware];
  if (routePath === 'financial-records') putMiddlewares.push(managerOnly);
  app.put(`/api/${routePath}/:id`, ...putMiddlewares, async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      if (fields.length === 0) {
        return res.status(400).json({ error: 'Request body is empty' });
      }
      const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map((f) => req.body[f]);
      values.push(req.params.id);

      const result = await db.query(
        `UPDATE ${table} SET ${setClauses} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`PUT /${routePath}/:id error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE — staff cannot delete financial-records
  const deleteMiddlewares = [authMiddleware];
  if (routePath === 'financial-records') deleteMiddlewares.push(managerOnly);
  app.delete(`/api/${routePath}/:id`, ...deleteMiddlewares, async (req, res) => {
    try {
      const result = await db.query(
        `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json({ message: 'Deleted successfully', deleted: result.rows[0] });
    } catch (err) {
      console.error(`DELETE /${routePath}/:id error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Register all CRUD routes
for (const [routePath, config] of Object.entries(resourceConfigs)) {
  registerCrudRoutes(app, routePath, config);
}

// ---------------------------------------------------------------------------
// NON-AI Feature Routes (Dashboard Stats, Alerts, Reports, Calendar, Export)
// ---------------------------------------------------------------------------

// Dashboard KPIs
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const [
      activeCases, totalCases, pendingAppointments, scheduledServices,
      monthlyRevenue, unpaidInvoices, lowInventory, activeStaff,
      pendingCremations, overdueAftercare
    ] = await Promise.all([
      db.query("SELECT COUNT(*) FROM cases WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM cases"),
      db.query("SELECT COUNT(*) FROM appointments WHERE status IN ('scheduled','confirmed') AND appointment_date >= CURRENT_DATE"),
      db.query("SELECT COUNT(*) FROM services WHERE status = 'scheduled' AND service_date >= CURRENT_DATE"),
      db.query("SELECT COALESCE(SUM(amount),0) as total FROM financial_records WHERE transaction_type IN ('payment','invoice') AND is_paid = true AND transaction_date >= date_trunc('month', CURRENT_DATE)"),
      db.query("SELECT COALESCE(SUM(amount),0) as total FROM financial_records WHERE transaction_type = 'invoice' AND (is_paid = false OR is_paid IS NULL)"),
      db.query("SELECT COUNT(*) FROM inventory WHERE quantity_on_hand <= reorder_level AND is_active = true"),
      db.query("SELECT COUNT(*) FROM staff WHERE is_active = true"),
      db.query("SELECT COUNT(*) FROM cremation WHERE status IN ('pending','authorized','scheduled')"),
      db.query("SELECT COUNT(*) FROM aftercare WHERE status = 'overdue'")
    ]);

    res.json({
      active_cases: parseInt(activeCases.rows[0].count),
      total_cases: parseInt(totalCases.rows[0].count),
      pending_appointments: parseInt(pendingAppointments.rows[0].count),
      scheduled_services: parseInt(scheduledServices.rows[0].count),
      monthly_revenue: parseFloat(monthlyRevenue.rows[0].total),
      unpaid_invoices: parseFloat(unpaidInvoices.rows[0].total),
      low_inventory_items: parseInt(lowInventory.rows[0].count),
      active_staff: parseInt(activeStaff.rows[0].count),
      pending_cremations: parseInt(pendingCremations.rows[0].count),
      overdue_aftercare: parseInt(overdueAftercare.rows[0].count)
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// Alerts Center
app.get('/api/alerts', authMiddleware, async (req, res) => {
  try {
    const alerts = [];

    // Expiring staff licenses (within 30 days)
    const expiringLicenses = await db.query(
      "SELECT first_name, last_name, license_number, license_expiry FROM staff WHERE license_expiry IS NOT NULL AND license_expiry <= CURRENT_DATE + INTERVAL '30 days' AND license_expiry >= CURRENT_DATE AND is_active = true ORDER BY license_expiry"
    );
    expiringLicenses.rows.forEach(r => {
      alerts.push({ type: 'warning', category: 'Staff License', message: `${r.first_name} ${r.last_name}'s license (${r.license_number}) expires ${new Date(r.license_expiry).toLocaleDateString()}`, date: r.license_expiry });
    });

    // Expired staff licenses
    const expiredLicenses = await db.query(
      "SELECT first_name, last_name, license_number, license_expiry FROM staff WHERE license_expiry IS NOT NULL AND license_expiry < CURRENT_DATE AND is_active = true"
    );
    expiredLicenses.rows.forEach(r => {
      alerts.push({ type: 'danger', category: 'Staff License', message: `${r.first_name} ${r.last_name}'s license (${r.license_number}) EXPIRED on ${new Date(r.license_expiry).toLocaleDateString()}`, date: r.license_expiry });
    });

    // Low inventory
    const lowStock = await db.query(
      "SELECT item_name, category, quantity_on_hand, reorder_level FROM inventory WHERE quantity_on_hand <= reorder_level AND is_active = true ORDER BY quantity_on_hand"
    );
    lowStock.rows.forEach(r => {
      alerts.push({ type: r.quantity_on_hand === 0 ? 'danger' : 'warning', category: 'Inventory', message: `${r.item_name} (${r.category}) is low: ${r.quantity_on_hand} remaining (reorder at ${r.reorder_level})`, date: null });
    });

    // Overdue aftercare follow-ups
    const overdueAftercare = await db.query(
      "SELECT family_contact_name, program_type, scheduled_date FROM aftercare WHERE status = 'scheduled' AND scheduled_date < CURRENT_DATE ORDER BY scheduled_date"
    );
    overdueAftercare.rows.forEach(r => {
      alerts.push({ type: 'warning', category: 'Aftercare', message: `Overdue follow-up for ${r.family_contact_name} (${r.program_type}) was scheduled ${new Date(r.scheduled_date).toLocaleDateString()}`, date: r.scheduled_date });
    });

    // Upcoming vehicle maintenance
    const vehicleMaintenance = await db.query(
      "SELECT vehicle_name, vehicle_type, next_service_date FROM fleet WHERE next_service_date IS NOT NULL AND next_service_date <= CURRENT_DATE + INTERVAL '14 days' AND status != 'retired' ORDER BY next_service_date"
    );
    vehicleMaintenance.rows.forEach(r => {
      alerts.push({ type: r.next_service_date <= new Date() ? 'danger' : 'info', category: 'Fleet', message: `${r.vehicle_name} (${r.vehicle_type}) maintenance due ${new Date(r.next_service_date).toLocaleDateString()}`, date: r.next_service_date });
    });

    // Expiring vendor contracts
    const vendorContracts = await db.query(
      "SELECT vendor_name, vendor_type, contract_expiry FROM vendors WHERE contract_expiry IS NOT NULL AND contract_expiry <= CURRENT_DATE + INTERVAL '30 days' AND is_active = true ORDER BY contract_expiry"
    );
    vendorContracts.rows.forEach(r => {
      alerts.push({ type: r.contract_expiry < new Date() ? 'danger' : 'warning', category: 'Vendor', message: `${r.vendor_name} contract ${r.contract_expiry < new Date() ? 'expired' : 'expiring'} ${new Date(r.contract_expiry).toLocaleDateString()}`, date: r.contract_expiry });
    });

    // Expiring vehicle insurance
    const vehicleInsurance = await db.query(
      "SELECT vehicle_name, insurance_expiry FROM fleet WHERE insurance_expiry IS NOT NULL AND insurance_expiry <= CURRENT_DATE + INTERVAL '30 days' AND status != 'retired' ORDER BY insurance_expiry"
    );
    vehicleInsurance.rows.forEach(r => {
      alerts.push({ type: r.insurance_expiry < new Date() ? 'danger' : 'warning', category: 'Fleet Insurance', message: `${r.vehicle_name} insurance ${r.insurance_expiry < new Date() ? 'expired' : 'expiring'} ${new Date(r.insurance_expiry).toLocaleDateString()}`, date: r.insurance_expiry });
    });

    // Pending insurance claims over 30 days
    const staleClaims = await db.query(
      "SELECT insurance_company, policy_number, claim_amount, submission_date FROM insurance_claims WHERE claim_status IN ('pending','submitted','under_review') AND submission_date < CURRENT_DATE - INTERVAL '30 days' ORDER BY submission_date"
    );
    staleClaims.rows.forEach(r => {
      alerts.push({ type: 'warning', category: 'Insurance', message: `Claim ${r.policy_number} with ${r.insurance_company} ($${parseFloat(r.claim_amount).toFixed(2)}) pending since ${new Date(r.submission_date).toLocaleDateString()}`, date: r.submission_date });
    });

    // Sort alerts: danger first, then warning, then info
    const priority = { danger: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (priority[a.type] || 3) - (priority[b.type] || 3));

    res.json(alerts);
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

// Financial Reports
app.get('/api/reports/financial', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'AND transaction_date >= $1 AND transaction_date <= $2';
      params.push(start_date, end_date);
    } else {
      dateFilter = "AND transaction_date >= date_trunc('month', CURRENT_DATE)";
    }

    const [revenue, expenses, byType, byMethod, recentTransactions] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(amount),0) as total FROM financial_records WHERE transaction_type IN ('payment') AND (is_paid = true) ${dateFilter}`, params),
      db.query(`SELECT COALESCE(SUM(amount),0) as total FROM financial_records WHERE transaction_type = 'expense' ${dateFilter}`, params),
      db.query(`SELECT transaction_type, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM financial_records WHERE 1=1 ${dateFilter} GROUP BY transaction_type ORDER BY total DESC`, params),
      db.query(`SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM financial_records WHERE transaction_type IN ('payment') AND (is_paid = true) ${dateFilter} AND payment_method IS NOT NULL GROUP BY payment_method ORDER BY total DESC`, params),
      db.query(`SELECT * FROM financial_records WHERE 1=1 ${dateFilter} ORDER BY transaction_date DESC LIMIT 20`, params)
    ]);

    // Monthly trend (last 6 months)
    const monthlyTrend = await db.query(`
      SELECT
        to_char(transaction_date, 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN transaction_type IN ('payment') AND is_paid = true THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM financial_records
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY to_char(transaction_date, 'YYYY-MM')
      ORDER BY month
    `);

    res.json({
      total_revenue: parseFloat(revenue.rows[0].total),
      total_expenses: parseFloat(expenses.rows[0].total),
      net_income: parseFloat(revenue.rows[0].total) - parseFloat(expenses.rows[0].total),
      by_type: byType.rows.map(r => ({ type: r.transaction_type, count: parseInt(r.count), total: parseFloat(r.total) })),
      by_payment_method: byMethod.rows.map(r => ({ method: r.payment_method, count: parseInt(r.count), total: parseFloat(r.total) })),
      monthly_trend: monthlyTrend.rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue), expenses: parseFloat(r.expenses) })),
      recent_transactions: recentTransactions.rows
    });
  } catch (err) {
    console.error('Financial report error:', err);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
});

// Calendar Events
app.get('/api/calendar/events', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;
    const events = [];

    const params = [];
    if (start && end) {
      params.push(start, end);
    }

    // Appointments
    const apptFilter = params.length ? 'AND appointment_date >= $1 AND appointment_date <= $2' : '';
    const appointments = await db.query(
      `SELECT id, title, appointment_type, appointment_date, start_time, end_time, client_name, status, location FROM appointments WHERE appointment_date IS NOT NULL ${apptFilter} ORDER BY appointment_date`, params
    );
    appointments.rows.forEach(r => {
      events.push({
        id: 'apt-' + r.id,
        title: r.title || r.appointment_type,
        date: r.appointment_date,
        start_time: r.start_time,
        end_time: r.end_time,
        type: 'appointment',
        subtype: r.appointment_type,
        status: r.status,
        detail: r.client_name ? `Client: ${r.client_name}` : '',
        location: r.location
      });
    });

    // Services
    const svcFilter = params.length ? 'AND service_date >= $1 AND service_date <= $2' : '';
    const services = await db.query(
      `SELECT id, service_type, service_date, service_time, location, status, estimated_attendees FROM services WHERE service_date IS NOT NULL ${svcFilter} ORDER BY service_date`, params
    );
    services.rows.forEach(r => {
      events.push({
        id: 'svc-' + r.id,
        title: (r.service_type || '').replace(/_/g, ' '),
        date: r.service_date,
        start_time: r.service_time,
        type: 'service',
        subtype: r.service_type,
        status: r.status,
        detail: r.estimated_attendees ? `${r.estimated_attendees} expected` : '',
        location: r.location
      });
    });

    // Cremations
    const cremFilter = params.length ? 'AND scheduled_date >= $1 AND scheduled_date <= $2' : '';
    const cremations = await db.query(
      `SELECT id, cremation_number, scheduled_date, scheduled_time, crematory_name, status FROM cremation WHERE scheduled_date IS NOT NULL ${cremFilter} ORDER BY scheduled_date`, params
    );
    cremations.rows.forEach(r => {
      events.push({
        id: 'crem-' + r.id,
        title: 'Cremation ' + (r.cremation_number || '#' + r.id),
        date: r.scheduled_date,
        start_time: r.scheduled_time,
        type: 'cremation',
        status: r.status,
        detail: r.crematory_name || '',
        location: r.crematory_name
      });
    });

    // Aftercare follow-ups
    const acFilter = params.length ? 'AND scheduled_date >= $1 AND scheduled_date <= $2' : '';
    const aftercare = await db.query(
      `SELECT id, family_contact_name, program_type, scheduled_date, assigned_staff, status FROM aftercare WHERE scheduled_date IS NOT NULL ${acFilter} ORDER BY scheduled_date`, params
    );
    aftercare.rows.forEach(r => {
      events.push({
        id: 'ac-' + r.id,
        title: (r.program_type || '').replace(/_/g, ' ') + ' - ' + r.family_contact_name,
        date: r.scheduled_date,
        type: 'aftercare',
        status: r.status,
        detail: r.assigned_staff ? `Staff: ${r.assigned_staff}` : ''
      });
    });

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(events);
  } catch (err) {
    console.error('Calendar events error:', err);
    res.status(500).json({ error: 'Failed to load calendar events' });
  }
});

// Case Pipeline (cases by status)
app.get('/api/cases/pipeline', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, case_number, deceased_first_name, deceased_last_name, date_of_death, status, assigned_staff, next_of_kin_name, created_at FROM cases ORDER BY created_at DESC"
    );
    const pipeline = {};
    result.rows.forEach(r => {
      const status = r.status || 'pending';
      if (!pipeline[status]) pipeline[status] = [];
      pipeline[status].push({
        id: r.id,
        case_number: r.case_number,
        deceased_name: ((r.deceased_first_name || '') + ' ' + (r.deceased_last_name || '')).trim(),
        date_of_death: r.date_of_death,
        assigned_staff: r.assigned_staff,
        next_of_kin: r.next_of_kin_name,
        created_at: r.created_at
      });
    });
    res.json(pipeline);
  } catch (err) {
    console.error('Case pipeline error:', err);
    res.status(500).json({ error: 'Failed to load case pipeline' });
  }
});

// CSV Export (supports token as query param for browser download)
app.get('/api/export/:resource', (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = 'Bearer ' + req.query.token;
  }
  authMiddleware(req, res, next);
}, async (req, res) => {
  try {
    const config = resourceConfigs[req.params.resource];
    if (!config) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    const result = await db.query(`SELECT * FROM ${config.table} ORDER BY id DESC`);
    if (result.rows.length === 0) {
      return res.status(200).send('No data to export');
    }

    const headers = Object.keys(result.rows[0]);
    const csvRows = [headers.join(',')];
    result.rows.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        if (val == null) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      });
      csvRows.push(values.join(','));
    });

    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${config.table}_export.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ---------------------------------------------------------------------------
// AI routes (all protected + rate limited)
// ---------------------------------------------------------------------------

// General analysis
app.post('/api/ai/analyze', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { feature, data, prompt } = req.body;
    const userMessage = `Feature: ${feature}\n\nData:\n${JSON.stringify(data, null, 2)}\n\nRequest: ${prompt}`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'analyze', feature || null, null, { feature, prompt }, { text });
    res.json({ text });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

// Generate obituary — auto-saves to obituaries table with ai_generated = true
app.post('/api/ai/generate-obituary', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { case_id, details } = req.body;

    let caseData = null;
    if (case_id) {
      const result = await db.query('SELECT * FROM cases WHERE id = $1', [case_id]);
      if (result.rows.length > 0) {
        caseData = result.rows[0];
      }
    }

    const userMessage = `Generate a professional, compassionate obituary based on the following information.\n\nCase Data:\n${JSON.stringify(caseData, null, 2)}\n\nAdditional Details:\n${JSON.stringify(details, null, 2)}`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);

    // Auto-save to obituaries table
    let savedObituary = null;
    try {
      const deceasedName = caseData
        ? `${caseData.deceased_first_name || ''} ${caseData.deceased_last_name || ''}`.trim()
        : (typeof details === 'string' ? details.substring(0, 80) : 'Unknown');

      const saveResult = await db.query(
        `INSERT INTO obituaries (case_id, deceased_name, content, status, ai_generated, date_of_birth, date_of_death)
         VALUES ($1, $2, $3, 'draft', true, $4, $5)
         RETURNING id`,
        [
          case_id || null,
          deceasedName,
          text,
          caseData ? caseData.date_of_birth || null : null,
          caseData ? caseData.date_of_death || null : null,
        ]
      );
      savedObituary = saveResult.rows[0];
    } catch (saveErr) {
      console.error('Auto-save obituary error (non-fatal):', saveErr.message);
    }

    await saveAiResult(req.user.id, 'generate-obituary', 'case', case_id || null, { case_id, details }, { text, obituary_id: savedObituary ? savedObituary.id : null });
    res.json({ text, saved: !!savedObituary, obituary_id: savedObituary ? savedObituary.id : null });
  } catch (err) {
    console.error('AI generate-obituary error:', err);
    res.status(500).json({ error: 'Obituary generation failed', details: err.message });
  }
});

// Compliance check
app.post('/api/ai/compliance-check', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { state_code, case_data } = req.body;

    const userMessage = `Analyze the funeral home compliance requirements for state: ${state_code}.\n\nCase Data:\n${JSON.stringify(case_data, null, 2)}\n\nProvide a detailed compliance analysis including:\n1. Required permits and licenses\n2. Timeline requirements\n3. Documentation needs\n4. Any potential compliance issues\n5. Recommendations for ensuring full compliance`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'compliance-check', 'state', null, { state_code, case_data }, { text });
    res.json({ text });
  } catch (err) {
    console.error('AI compliance-check error:', err);
    res.status(500).json({ error: 'Compliance check failed', details: err.message });
  }
});

// Grief support recommendation
app.post('/api/ai/grief-recommendation', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { situation } = req.body;

    const userMessage = `Based on the following situation, recommend appropriate grief support resources, counseling approaches, and community support options.\n\nSituation:\n${situation}\n\nProvide compassionate, professional recommendations including:\n1. Immediate support resources\n2. Ongoing counseling recommendations\n3. Support group suggestions\n4. Self-care strategies\n5. When to seek professional help`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'grief-recommendation', null, null, { situation }, { text });
    res.json({ text });
  } catch (err) {
    console.error('AI grief-recommendation error:', err);
    res.status(500).json({ error: 'Grief recommendation failed', details: err.message });
  }
});

// Pricing estimate
app.post('/api/ai/pricing-estimate', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { services, merchandise } = req.body;

    const userMessage = `Generate a detailed pricing estimate for the following funeral services and merchandise.\n\nServices Requested:\n${JSON.stringify(services, null, 2)}\n\nMerchandise:\n${JSON.stringify(merchandise, null, 2)}\n\nProvide:\n1. Itemized cost breakdown\n2. Explanation of each charge\n3. Optional add-ons with pricing\n4. Payment plan suggestions\n5. Any applicable discounts or packages`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'pricing-estimate', null, null, { services, merchandise }, { text });
    res.json({ text });
  } catch (err) {
    console.error('AI pricing-estimate error:', err);
    res.status(500).json({ error: 'Pricing estimate failed', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW AI endpoint: Embalming Report
// ---------------------------------------------------------------------------
app.post('/api/ai/embalming-report', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { embalming_id } = req.body;
    if (!embalming_id) {
      return res.status(400).json({ error: 'embalming_id is required' });
    }

    const embResult = await db.query('SELECT * FROM embalming WHERE id = $1', [embalming_id]);
    if (embResult.rows.length === 0) {
      return res.status(404).json({ error: 'Embalming record not found' });
    }
    const embRecord = embResult.rows[0];

    // Also fetch case data if available
    let caseData = null;
    if (embRecord.case_id) {
      const caseResult = await db.query('SELECT * FROM cases WHERE id = $1', [embRecord.case_id]);
      if (caseResult.rows.length > 0) caseData = caseResult.rows[0];
    }

    const userMessage = `Generate a structured state-format mortuary embalming report for the following embalming record. Format it as an official mortuary science report suitable for state regulatory submission.\n\nEmbalming Record:\n${JSON.stringify(embRecord, null, 2)}\n\nAssociated Case:\n${JSON.stringify(caseData, null, 2)}\n\nInclude sections for:\n1. Decedent identification\n2. Embalmer credentials and license\n3. Preparation details (chemicals used, arterial/cavity treatment)\n4. Condition assessment on receipt\n5. Procedure performed\n6. Cosmetic and restoration work\n7. Compliance attestation\n8. Embalmer signature block`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'embalming-report', 'embalming', embalming_id, { embalming_id }, { text });
    res.json({ text, embalming_id, embalmer_name: embRecord.embalmer_name });
  } catch (err) {
    console.error('AI embalming-report error:', err);
    res.status(500).json({ error: 'Embalming report generation failed', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW AI endpoint: Aftercare Email
// ---------------------------------------------------------------------------
app.post('/api/ai/aftercare-email', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { case_id, weeks_since_service } = req.body;
    if (!case_id) {
      return res.status(400).json({ error: 'case_id is required' });
    }

    const validWeeks = [2, 4, 26];
    const weeks = parseInt(weeks_since_service) || 2;
    if (!validWeeks.includes(weeks)) {
      return res.status(400).json({ error: 'weeks_since_service must be 2, 4, or 26' });
    }

    const caseResult = await db.query('SELECT * FROM cases WHERE id = $1', [case_id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    const caseData = caseResult.rows[0];

    const timeLabel = weeks === 2 ? '2-week' : weeks === 4 ? '1-month' : '6-month';

    const userMessage = `Generate a compassionate ${timeLabel} aftercare follow-up email for the family of the deceased. This email will be sent by the funeral home director to the next of kin.\n\nCase Data:\n${JSON.stringify(caseData, null, 2)}\n\nThis is the ${timeLabel} check-in (${weeks} weeks after the service). The email should:\n1. Open with a warm, compassionate greeting using the next of kin's name\n2. Acknowledge the time that has passed since the service\n3. Provide grief support resources appropriate for this stage of bereavement\n4. Gently offer continued support from the funeral home\n5. Include any relevant anniversary reminders or upcoming milestones\n6. Close with a sincere, professional sign-off\n7. Keep tone warm but professional — never clinical or transactional`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'aftercare-email', 'case', case_id, { case_id, weeks }, { text, time_label: timeLabel });
    res.json({ text, case_id, weeks_since_service: weeks, time_label: timeLabel });
  } catch (err) {
    console.error('AI aftercare-email error:', err);
    res.status(500).json({ error: 'Aftercare email generation failed', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW AI endpoint: Pre-need Conversion Summary
// ---------------------------------------------------------------------------
app.post('/api/ai/preneed-conversion-summary', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { preneed_id } = req.body;
    if (!preneed_id) {
      return res.status(400).json({ error: 'preneed_id is required' });
    }

    const preneedResult = await db.query('SELECT * FROM preneed WHERE id = $1', [preneed_id]);
    if (preneedResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pre-need record not found' });
    }
    const preneedData = preneedResult.rows[0];

    const userMessage = `Generate a comprehensive case handoff summary for converting a pre-need funeral contract to an at-need (active) case. This document will be used by the funeral director to initiate arrangements.\n\nPre-Need Contract:\n${JSON.stringify(preneedData, null, 2)}\n\nProvide a structured handoff summary including:\n1. Client/decedent identification and key details\n2. Pre-arranged service preferences and selections\n3. Financial summary (amount paid, outstanding balance, payment method)\n4. Special instructions or wishes\n5. Family contact information and relationships\n6. Recommended next steps for the funeral director\n7. Documents that need to be transferred or updated\n8. Any compliance considerations for the conversion`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    await saveAiResult(req.user.id, 'preneed-conversion-summary', 'preneed', preneed_id, { preneed_id }, { text });
    res.json({ text, preneed_id, client_name: `${preneedData.client_first_name || ''} ${preneedData.client_last_name || ''}`.trim() });
  } catch (err) {
    console.error('AI preneed-conversion-summary error:', err);
    res.status(500).json({ error: 'Pre-need conversion summary failed', details: err.message });
  }
});

// ===========================================================================
// NEW AI ENDPOINTS (5 custom features per audit)
// ===========================================================================

// 1. AI Grief-Stage Classifier on aftercare records
//    Scores family responses, optionally promotes to "needs counseling escalation".
app.post('/api/ai/grief-stage-classifier', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { aftercare_id, family_response_text } = req.body;
    if (!aftercare_id) return res.status(400).json({ error: 'aftercare_id is required' });

    const acResult = await db.query('SELECT * FROM aftercare WHERE id = $1', [aftercare_id]);
    if (acResult.rows.length === 0) return res.status(404).json({ error: 'Aftercare record not found' });
    const aftercare = acResult.rows[0];

    const responseText = family_response_text || aftercare.notes || '';
    const systemPrompt = `You are a licensed grief counselor analyzing family responses. Return STRICT JSON only with the schema:\n{"grief_stage": "denial|anger|bargaining|depression|acceptance|complicated_grief", "stage_confidence": 0-100, "risk_score": 0-100, "needs_escalation": true|false, "escalation_reasons": ["..."], "recommended_resources": ["..."], "suggested_next_contact_days": 7|14|30, "summary": "..."}`;
    const userPrompt = `Aftercare record:\n${JSON.stringify(aftercare, null, 2)}\n\nFamily response/notes:\n${responseText}\n\nReturn JSON only.`;
    const raw = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(raw);

    // Auto-promote to escalation if needs_escalation = true (best-effort UPDATE)
    let escalated = false;
    if (parsed && parsed.needs_escalation === true) {
      try {
        await db.query(
          "UPDATE aftercare SET status = 'needs_counseling_escalation', notes = COALESCE(notes,'') || E'\\n[AI ESCALATION] ' || $1 WHERE id = $2",
          [parsed.summary || 'Counseling escalation flagged', aftercare_id]
        );
        escalated = true;
      } catch (e) {
        console.error('escalation update failed:', e.message);
      }
    }

    await saveAiResult(req.user.id, 'grief-stage-classifier', 'aftercare', aftercare_id, { aftercare_id, family_response_text }, parsed);
    res.json({ success: true, classification: parsed, escalated });
  } catch (err) {
    console.error('grief-stage-classifier error:', err);
    res.status(500).json({ error: 'Grief stage classification failed', details: err.message });
  }
});

// 2. AI State-Specific Permit Checklist Generator
//    Given case state + service type, AI emits a checklist row-set written into case_permits.
app.post('/api/ai/permit-checklist', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { case_id, state_code, service_type } = req.body;
    if (!case_id || !state_code || !service_type) {
      return res.status(400).json({ error: 'case_id, state_code, and service_type are required' });
    }
    const caseResult = await db.query('SELECT * FROM cases WHERE id = $1', [case_id]);
    if (caseResult.rows.length === 0) return res.status(404).json({ error: 'Case not found' });
    const caseData = caseResult.rows[0];

    const systemPrompt = `You are a US funeral-industry compliance expert. Return STRICT JSON only:\n{"jurisdiction": "<state>", "permits": [{"permit_name": "...", "required": true|false, "due_in_days": <int>, "issuing_authority": "...", "notes": "..."}], "summary": "..."}`;
    const userPrompt = `Generate the complete permit/filing checklist for state code "${state_code}" and service type "${service_type}".\nCase context:\n${JSON.stringify(caseData, null, 2)}\nReturn JSON only.`;
    const raw = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(raw);

    let inserted = 0;
    const permits = (parsed && Array.isArray(parsed.permits)) ? parsed.permits : [];
    for (const p of permits) {
      try {
        const dueDate = p.due_in_days != null
          ? new Date(Date.now() + (parseInt(p.due_in_days) || 0) * 86400000).toISOString().slice(0, 10)
          : null;
        await db.query(
          `INSERT INTO case_permits (case_id, permit_name, jurisdiction, due_date, status, notes, ai_generated)
           VALUES ($1, $2, $3, $4, 'pending', $5, true)`,
          [case_id, p.permit_name || 'Unnamed Permit', state_code, dueDate, (p.notes || '') + (p.issuing_authority ? ` (Authority: ${p.issuing_authority})` : '')]
        );
        inserted++;
      } catch (e) {
        console.error('permit insert error:', e.message);
      }
    }

    await saveAiResult(req.user.id, 'permit-checklist', 'case', case_id, { case_id, state_code, service_type }, { ...parsed, inserted });
    res.json({ success: true, checklist: parsed, permits_inserted: inserted });
  } catch (err) {
    console.error('permit-checklist error:', err);
    res.status(500).json({ error: 'Permit checklist generation failed', details: err.message });
  }
});

// Read endpoint for case_permits to support frontend listing
app.get('/api/case-permits', authMiddleware, async (req, res) => {
  try {
    const { case_id } = req.query;
    let q = 'SELECT * FROM case_permits';
    const params = [];
    if (case_id) {
      q += ' WHERE case_id = $1';
      params.push(case_id);
    }
    q += ' ORDER BY due_date ASC NULLS LAST, id DESC';
    const r = await db.query(q, params);
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/case-permits/:id', authMiddleware, async (req, res) => {
  try {
    const fields = Object.keys(req.body || {});
    if (fields.length === 0) return res.status(400).json({ error: 'Empty body' });
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map((f) => req.body[f]);
    values.push(req.params.id);
    const r = await db.query(`UPDATE case_permits SET ${setClauses} WHERE id = $${values.length} RETURNING *`, values);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. AI Pre-need At-risk Model
//    Flags pre-need contracts whose payer is delinquent and drafts personalized outreach email.
app.post('/api/ai/preneed-at-risk', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    // Pull all preneed contracts; classify based on payment_status / balance / last_payment_date heuristics
    const preneedRows = await db.query('SELECT * FROM preneed ORDER BY id DESC LIMIT 200').catch(() => ({ rows: [] }));
    const candidates = preneedRows.rows.filter((r) => {
      // Heuristic: at risk if balance > 0 AND status not in ('paid_in_full','cancelled') AND last_payment > 60d or null
      const balance = parseFloat(r.outstanding_balance || r.balance || 0);
      const status = (r.payment_status || r.status || '').toLowerCase();
      if (status.includes('paid') || status.includes('cancelled')) return false;
      if (balance <= 0) return false;
      const lastPay = r.last_payment_date ? new Date(r.last_payment_date) : null;
      if (!lastPay) return true;
      const daysSince = (Date.now() - lastPay.getTime()) / 86400000;
      return daysSince > 60;
    }).slice(0, 25);

    if (candidates.length === 0) {
      return res.json({ success: true, at_risk_count: 0, recommendations: [], message: 'No at-risk pre-need contracts detected.' });
    }

    const systemPrompt = `You are a pre-need funeral contract retention specialist. Return STRICT JSON only:\n{"at_risk_contracts": [{"preneed_id": <int>, "client_name": "...", "risk_level": "low|medium|high|critical", "reasoning": "...", "outreach_email": {"subject": "...", "body": "..."}}], "summary": "..."}`;
    const userPrompt = `These pre-need contracts appear delinquent. Score risk and draft a compassionate but firm outreach email for each.\n\nContracts:\n${JSON.stringify(candidates, null, 2)}\n\nReturn JSON only.`;
    const raw = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(raw);

    await saveAiResult(req.user.id, 'preneed-at-risk', null, null, { candidate_count: candidates.length }, parsed);
    res.json({ success: true, at_risk_count: candidates.length, recommendations: parsed });
  } catch (err) {
    console.error('preneed-at-risk error:', err);
    res.status(500).json({ error: 'Pre-need at-risk analysis failed', details: err.message });
  }
});

// 4. AI Memorial Product Upsell Engine
//    Given case demographics + selected services, AI suggests merchandise from memorial_products
//    ranked by margin and family budget.
app.post('/api/ai/memorial-upsell', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { case_id, family_budget } = req.body;
    if (!case_id) return res.status(400).json({ error: 'case_id is required' });
    const [caseRes, servicesRes, productsRes] = await Promise.all([
      db.query('SELECT * FROM cases WHERE id = $1', [case_id]),
      db.query('SELECT * FROM services WHERE case_id = $1', [case_id]),
      db.query('SELECT * FROM memorial_products ORDER BY id DESC LIMIT 100').catch(() => ({ rows: [] })),
    ]);
    if (caseRes.rows.length === 0) return res.status(404).json({ error: 'Case not found' });

    const systemPrompt = `You are a respectful, ethical funeral merchandise advisor. Suggest add-on memorial products that match the family's situation and budget. Rank by a balance of margin and emotional fit. Return STRICT JSON only:\n{"recommendations": [{"product_id": <int|null>, "product_name": "...", "estimated_price": "...", "estimated_margin_percent": <int>, "reason": "...", "tact_level": "low_pressure|moderate|premium"}], "summary": "..."}`;
    const userPrompt = `Case:\n${JSON.stringify(caseRes.rows[0], null, 2)}\n\nServices selected:\n${JSON.stringify(servicesRes.rows, null, 2)}\n\nFamily budget hint: ${family_budget || 'unspecified'}\n\nAvailable memorial_products catalog:\n${JSON.stringify(productsRes.rows, null, 2)}\n\nReturn JSON only.`;
    const raw = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(raw);
    await saveAiResult(req.user.id, 'memorial-upsell', 'case', case_id, { case_id, family_budget }, parsed);
    res.json({ success: true, recommendations: parsed });
  } catch (err) {
    console.error('memorial-upsell error:', err);
    res.status(500).json({ error: 'Memorial upsell failed', details: err.message });
  }
});

// 5. Embalming Chemicals Batch Tracker
//    Link embalming rows to inventory SKU lots; low-stock alerts list which decedent each lot was used on.
app.post('/api/embalming-chemical-lots', authMiddleware, async (req, res) => {
  try {
    const { embalming_id, inventory_id, lot_number, quantity_used, unit } = req.body;
    if (!embalming_id) return res.status(400).json({ error: 'embalming_id is required' });
    const r = await db.query(
      'INSERT INTO embalming_chemical_lots (embalming_id, inventory_id, lot_number, quantity_used, unit) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [embalming_id, inventory_id || null, lot_number || null, quantity_used || null, unit || null]
    );

    // Decrement inventory if linked
    if (inventory_id && quantity_used) {
      try {
        await db.query(
          'UPDATE inventory SET quantity_on_hand = GREATEST(0, COALESCE(quantity_on_hand,0) - $1) WHERE id = $2',
          [quantity_used, inventory_id]
        );
      } catch (e) {
        console.error('inventory decrement failed:', e.message);
      }
    }
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('embalming-chemical-lots create error:', err);
    res.status(500).json({ error: 'Failed to create chemical lot record' });
  }
});

app.get('/api/embalming-chemical-lots', authMiddleware, async (req, res) => {
  try {
    const { embalming_id, inventory_id } = req.query;
    let q = `
      SELECT ecl.*,
             i.item_name AS inventory_item_name,
             i.sku AS inventory_sku,
             i.quantity_on_hand AS inventory_remaining,
             i.reorder_level AS inventory_reorder_level,
             e.embalmer_name,
             c.case_number,
             c.deceased_first_name,
             c.deceased_last_name
      FROM embalming_chemical_lots ecl
      LEFT JOIN inventory i ON i.id = ecl.inventory_id
      LEFT JOIN embalming e ON e.id = ecl.embalming_id
      LEFT JOIN cases c ON c.id = e.case_id
    `;
    const where = [];
    const params = [];
    if (embalming_id) { params.push(embalming_id); where.push(`ecl.embalming_id = $${params.length}`); }
    if (inventory_id) { params.push(inventory_id); where.push(`ecl.inventory_id = $${params.length}`); }
    if (where.length) q += ' WHERE ' + where.join(' AND ');
    q += ' ORDER BY ecl.used_at DESC LIMIT 200';
    const r = await db.query(q, params);
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cross-table provenance: low-stock items + the decedents whose embalming consumed each lot
app.get('/api/embalming-chemical-lots/low-stock-provenance', authMiddleware, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.id AS inventory_id, i.item_name, i.sku, i.quantity_on_hand, i.reorder_level,
             COALESCE(json_agg(json_build_object(
               'embalming_id', ecl.embalming_id,
               'lot_number', ecl.lot_number,
               'quantity_used', ecl.quantity_used,
               'used_at', ecl.used_at,
               'case_number', c.case_number,
               'deceased_name', TRIM(CONCAT_WS(' ', c.deceased_first_name, c.deceased_last_name))
             )) FILTER (WHERE ecl.id IS NOT NULL), '[]') AS lots
      FROM inventory i
      LEFT JOIN embalming_chemical_lots ecl ON ecl.inventory_id = i.id
      LEFT JOIN embalming e ON e.id = ecl.embalming_id
      LEFT JOIN cases c ON c.id = e.case_id
      WHERE i.quantity_on_hand <= COALESCE(i.reorder_level, 0)
      GROUP BY i.id
      ORDER BY i.quantity_on_hand ASC
      LIMIT 100
    `);
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Apply pass 5 — additive backlog routes (notifications, registry stubs,
// vendor directory, family portal token, probate checklist).
// ---------------------------------------------------------------------------
try {
  require('./routes/backlog').register(app, { authMiddleware, db });
  require('./routes/preneedConversionAgent').register(app, { authMiddleware, db });
  require('./routes/multiStatePermitAutoFiler').register(app, { authMiddleware, db });
  console.log('Apply pass 5 backlog routes registered.');
} catch (err) {
  console.error('Apply pass 5 backlog registration failed (non-fatal):', err.message);
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.use('/api/gap-no-casketurn-recommendation-ai-for-famil', route_gap_no_casketurn_recommendation_ai_for_famil);
app.use('/api/gap-no-vendor-performance-scoring-ai', route_gap_no_vendor_performance_scoring_ai);
app.use('/api/gap-no-demand-forecast-for-service-capacity', route_gap_no_demand_forecast_for_service_capacity);
app.use('/api/gap-no-after-care-churn-risk-model', route_gap_no_after_care_churn_risk_model);
app.use('/api/gap-no-real-spa-frontend-public-static', route_gap_no_real_spa_frontend_public_static);
app.use('/api/gap-no-webhook-subscribersdispatchers', route_gap_no_webhook_subscribersdispatchers);
app.use('/api/gap-no-real-smtptwilio-integration-only-need', route_gap_no_real_smtptwilio_integration_only_need);
app.use('/api/gap-no-file-upload-module-for-case', route_gap_no_file_upload_module_for_case);
app.use('/api/gap-no-real-time-chat-with-families', route_gap_no_real_time_chat_with_families);
app.use('/api/gap-no-payment-processing', route_gap_no_payment_processing);

app.listen(PORT, async () => {
  console.log(`\n=== Eternal Haven Funeral Home Operations Manager ===`);
  console.log(`Server running on port ${PORT}`);

  // Check database connection
  try {
    await db.query('SELECT NOW()');
    console.log('Database connection: OK');
  } catch (err) {
    console.error('Database connection: FAILED -', err.message);
  }

  // Count available routes
  let routeCount = 0;
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routeCount++;
    }
  });
  console.log(`Available routes: ${routeCount}`);
  console.log(`AI model: anthropic/claude-3-5-sonnet-20241022`);
  console.log('====================================================\n');
});
