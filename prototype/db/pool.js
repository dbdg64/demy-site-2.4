// Database connection pool — standard pg for Supabase/any Postgres
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL not set. Get one from your Supabase project dashboard:\n' +
        'Project Settings → Database → Connection string (use the pooler on port 6543)'
      );
    }
    pool = new Pool({
      connectionString,
      // Supabase pooler (PgBouncer) needs these:
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

async function query(text, params) {
  const client = getPool();
  const result = await client.query(text, params);
  return result;
}

async function end() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, end };
