require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const bcrypt = require('bcryptjs');
const db = require('../db');

async function main() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
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
  `);
  const email = process.env.ADMIN_EMAIL || 'runtime-admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'RuntimeAcceptance123!';
  const passwordHash = await bcrypt.hash(password, 12);
  await db.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role`,
    [email.trim().toLowerCase(), passwordHash, 'Runtime Administrator']
  );
}

main()
  .then(() => db.pool.end())
  .catch(async (error) => {
    console.error(`Runtime initialization failed: ${error.message}`);
    await db.pool.end().catch(() => {});
    process.exit(1);
  });
