#!/usr/bin/env node
// Seed the database on Neon Postgres
// Usage: node scripts/seed.js
// Requires DATABASE_URL env var

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { initDb } = require('../db/init');

initDb()
  .then(() => {
    console.log('✅ Database seeded successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
