// Database connection pool — standard pg for Supabase/any Postgres
const { Pool } = require('pg');
const dns = require('dns');
const { URL } = require('url');

let pool;
let resolving;

function isLocal() {
  return !process.env.VERCEL;
}

function resolveIPv4(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

async function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL not set. Get one from your Supabase project dashboard:\n' +
        'Project Settings → Database → Connection string (use the pooler on port 6543)'
      );
    }

    const opts = {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    if (isLocal()) {
      try {
        const url = new URL(connectionString);
        if (!resolving) {
          resolving = resolveIPv4(url.hostname);
        }
        const ipv4 = await resolving;
        opts.host = ipv4;
        opts.port = parseInt(url.port) || 5432;
        opts.user = url.username;
        opts.password = decodeURIComponent(url.password);
        opts.database = url.pathname.slice(1);
        resolving = null;
      } catch {
        opts.connectionString = connectionString;
      }
    } else {
      opts.connectionString = connectionString;
    }

    pool = new Pool(opts);
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool();
  const result = await client.query(text, params);
  return result;
}

async function end() {
  if (pool) {
    const p = pool;
    pool = null;
    resolving = null;
    await p.end();
  }
}

module.exports = { getPool, query, end };
