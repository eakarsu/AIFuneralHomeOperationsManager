require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'eternal-haven-secret-key';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

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

// ---------------------------------------------------------------------------
// OpenRouter AI helper
// ---------------------------------------------------------------------------
async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
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

  // GET all (with optional search)
  app.get(`/api/${routePath}`, authMiddleware, async (req, res) => {
    try {
      const { search } = req.query;
      let query;
      let params = [];

      if (search && searchCols.length > 0) {
        const conditions = searchCols.map(
          (col, i) => `${col}::text ILIKE $1`
        );
        query = `SELECT * FROM ${table} WHERE ${conditions.join(' OR ')} ORDER BY id DESC`;
        params = [`%${search}%`];
      } else {
        query = `SELECT * FROM ${table} ORDER BY id DESC`;
      }

      const result = await db.query(query, params);
      res.json(result.rows);
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

  // POST create
  app.post(`/api/${routePath}`, authMiddleware, async (req, res) => {
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

  // PUT update
  app.put(`/api/${routePath}/:id`, authMiddleware, async (req, res) => {
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

  // DELETE
  app.delete(`/api/${routePath}/:id`, authMiddleware, async (req, res) => {
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
    const { start_date, end_date, period } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'AND transaction_date >= $1 AND transaction_date <= $2';
      params.push(start_date, end_date);
    } else {
      // Default to current month
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

    let dateFilter = '';
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
  // Allow token via query param for direct browser download
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
// AI routes (all protected)
// ---------------------------------------------------------------------------

// General analysis
app.post('/api/ai/analyze', authMiddleware, async (req, res) => {
  try {
    const { feature, data, prompt } = req.body;
    const userMessage = `Feature: ${feature}\n\nData:\n${JSON.stringify(data, null, 2)}\n\nRequest: ${prompt}`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    res.json({ text });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

// Generate obituary
app.post('/api/ai/generate-obituary', authMiddleware, async (req, res) => {
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
    res.json({ text });
  } catch (err) {
    console.error('AI generate-obituary error:', err);
    res.status(500).json({ error: 'Obituary generation failed', details: err.message });
  }
});

// Compliance check
app.post('/api/ai/compliance-check', authMiddleware, async (req, res) => {
  try {
    const { state_code, case_data } = req.body;

    const userMessage = `Analyze the funeral home compliance requirements for state: ${state_code}.\n\nCase Data:\n${JSON.stringify(case_data, null, 2)}\n\nProvide a detailed compliance analysis including:\n1. Required permits and licenses\n2. Timeline requirements\n3. Documentation needs\n4. Any potential compliance issues\n5. Recommendations for ensuring full compliance`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    res.json({ text });
  } catch (err) {
    console.error('AI compliance-check error:', err);
    res.status(500).json({ error: 'Compliance check failed', details: err.message });
  }
});

// Grief support recommendation
app.post('/api/ai/grief-recommendation', authMiddleware, async (req, res) => {
  try {
    const { situation } = req.body;

    const userMessage = `Based on the following situation, recommend appropriate grief support resources, counseling approaches, and community support options.\n\nSituation:\n${situation}\n\nProvide compassionate, professional recommendations including:\n1. Immediate support resources\n2. Ongoing counseling recommendations\n3. Support group suggestions\n4. Self-care strategies\n5. When to seek professional help`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    res.json({ text });
  } catch (err) {
    console.error('AI grief-recommendation error:', err);
    res.status(500).json({ error: 'Grief recommendation failed', details: err.message });
  }
});

// Pricing estimate
app.post('/api/ai/pricing-estimate', authMiddleware, async (req, res) => {
  try {
    const { services, merchandise } = req.body;

    const userMessage = `Generate a detailed pricing estimate for the following funeral services and merchandise.\n\nServices Requested:\n${JSON.stringify(services, null, 2)}\n\nMerchandise:\n${JSON.stringify(merchandise, null, 2)}\n\nProvide:\n1. Itemized cost breakdown\n2. Explanation of each charge\n3. Optional add-ons with pricing\n4. Payment plan suggestions\n5. Any applicable discounts or packages`;
    const text = await callOpenRouter(SYSTEM_PROMPT, userMessage);
    res.json({ text });
  } catch (err) {
    console.error('AI pricing-estimate error:', err);
    res.status(500).json({ error: 'Pricing estimate failed', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
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
  console.log('====================================================\n');
});
