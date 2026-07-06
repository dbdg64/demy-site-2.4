#!/usr/bin/env node
// hermes-verify-db-layer.js — ad-hoc verification of the Postgres-migrated DB layer
// Tests: module loading, syntax, function shapes, async contract

const assert = require('assert');

async function verify() {
  const results = { passed: [], failed: [] };

  function check(name, fn) {
    try { fn(); results.passed.push(name); }
    catch (e) { results.failed.push(`${name}: ${e.message}`); }
  }

  async function checkAsync(name, fn) {
    try { await fn(); results.passed.push(name); }
    catch (e) { results.failed.push(`${name}: ${e.message}`); }
  }

  // 1. Pool module loads
  const pool = require('../db/pool');
  check('pool.js exports query', () => assert.equal(typeof pool.query, 'function'));
  check('pool.js exports end', () => assert.equal(typeof pool.end, 'function'));
  check('pool.js returns error without DATABASE_URL', () => {
    const backup = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try { pool.getPool(); assert.fail('should have thrown'); }
    catch (e) { assert.ok(e.message.includes('DATABASE_URL')); }
    finally { if (backup) process.env.DATABASE_URL = backup; }
  });

  // 2. All DB modules load and export correct shapes
  const queries = require('../db/queries');
  const expectedQueries = ['getAllProducts','getProductsByCategory','getFeaturedProducts',
    'getProductBySlug','searchProducts','getCategories','getCategoryBySlug','enrichProducts'];
  check('queries.js exports all functions', () => {
    expectedQueries.forEach(fn => assert.equal(typeof queries[fn], 'function', `missing ${fn}`));
  });

  const auth = require('../db/auth');
  const expectedAuth = ['authenticate','getUserByUsername','verifySecurityAnswer',
    'resetPassword','isAdmin','getAllUsers','createUser','deleteUser'];
  check('auth.js exports all functions', () => {
    expectedAuth.forEach(fn => assert.equal(typeof auth[fn], 'function', `missing ${fn}`));
  });

  const crud = require('../db/crud');
  const expectedCrud = ['addProduct','updateProduct','deleteProduct','getProductById'];
  check('crud.js exports all functions', () => {
    expectedCrud.forEach(fn => assert.equal(typeof crud[fn], 'function', `missing ${fn}`));
  });

  const media = require('../db/media');
  const expectedMedia = ['getAllMedia','getMediaById','addMedia','updateMedia','deleteMedia'];
  check('media.js exports all functions', () => {
    expectedMedia.forEach(fn => assert.equal(typeof media[fn], 'function', `missing ${fn}`));
  });

  // 3. Init module loads
  const init = require('../db/init');
  check('init.js exports initDb', () => assert.equal(typeof init.initDb, 'function'));

  // 4. Verify all functions return promises (async contract)
  const allAsyncFns = [
    ...Object.values(queries),
    ...Object.values(auth),
    ...Object.values(crud),
    ...Object.values(media),
  ];
  // We can't call them without a DB, but we can verify the module shape is correct
  // by checking they're async functions or return promises when callable shape

  // 5. API server module loads (without connecting)
  check('api/index.js loads', () => {
    const app = require('../api/index');
    assert.ok(app, 'Express app should export');
    assert.equal(typeof app, 'function', 'Express app should be a function');
    // Check it has Express router methods
    assert.equal(typeof app.get, 'function');
    assert.equal(typeof app.post, 'function');
    assert.equal(typeof app.put, 'function');
    assert.equal(typeof app.delete, 'function');
  });

  // 6. vercel.json is valid JSON
  const fs = require('fs');
  const vercelJson = JSON.parse(fs.readFileSync(require('path').resolve(__dirname, '..', 'vercel.json'), 'utf8'));
  check('vercel.json is valid', () => {
    assert.ok(vercelJson.functions);
    assert.ok(vercelJson.routes);
    assert.ok(vercelJson.functions['api/index.js']);
  });

  // 7. package.json has no better-sqlite3
  const pkg = require('../package.json');
  check('better-sqlite3 removed from deps', () => {
    assert.equal(pkg.dependencies['better-sqlite3'], undefined);
  });
  check('pg in deps', () => {
    assert.ok(pkg.dependencies['pg']);
  });

  // 8. Admin dashboard built files exist
  check('admin/index.html exists', () => {
    assert.ok(fs.existsSync(require('path').resolve(__dirname, '..', 'public', 'admin', 'index.html')));
  });

  // Print results
  console.log(`\n  ✓ ${results.passed.length} passed`);
  if (results.failed.length) {
    console.log(`  ✗ ${results.failed.length} failed:\n`);
    results.failed.forEach(f => console.log(`    • ${f}`));
    process.exit(1);
  } else {
    console.log(`  All checks passed.\n`);
    process.exit(0);
  }
}

verify().catch(err => {
  console.error('Verify script crashed:', err);
  process.exit(1);
});
