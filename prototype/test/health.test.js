const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const http = require('node:http');

// Mock DB deps so the module loads without a real database
const mockQuery = require('vitest').vi.fn();
require('vitest').vi.mock('../db/pool', () => ({
  getPool: require('vitest').vi.fn(),
  query: mockQuery,
  end: require('vitest').vi.fn(),
}));
require('vitest').vi.mock('../db/queries', () => ({
  getAllProducts: require('vitest').vi.fn(),
  getProductBySlug: require('vitest').vi.fn(),
}));
require('vitest').vi.mock('../db/auth', () => ({
  authenticate: require('vitest').vi.fn(),
  getUserByUsername: require('vitest').vi.fn(),
}));
require('vitest').vi.mock('../db/crud', () => ({
  createProduct: require('vitest').vi.fn(),
  updateProduct: require('vitest').vi.fn(),
  deleteProduct: require('vitest').vi.fn(),
}));
require('vitest').vi.mock('../db/media', () => ({
  getAllMedia: require('vitest').vi.fn(),
  createMedia: require('vitest').vi.fn(),
  updateMedia: require('vitest').vi.fn(),
}));

let app;
let server;
let baseUrl;

beforeAll(async () => {
  app = require('../api/index');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const addr = server.address();
  baseUrl = `http://localhost:${addr.port}`;
});

afterAll(() => {
  server?.close();
});

async function get(path) {
  const res = await fetch(`${baseUrl}${path}`);
  const body = res.headers.get('content-type')?.includes('json')
    ? await res.json()
    : await res.text();
  return { status: res.status, body };
}

describe('GET /api/ping', () => {
  it('responds with ok: true and a timestamp', async () => {
    const { status, body } = await get('/api/ping');
    expect(status).toBe(200);
    expect(body).toHaveProperty('ok', true);
    expect(body).toHaveProperty('time');
    expect(typeof body.time).toBe('number');
  });

  it('returns a recent timestamp (within the last second)', async () => {
    const before = Date.now();
    const { body } = await get('/api/ping');
    const after = Date.now();
    expect(body.time).toBeGreaterThanOrEqual(before);
    expect(body.time).toBeLessThanOrEqual(after);
  });

  it('does not require authentication', async () => {
    const { status } = await get('/api/ping');
    // Should 200, not 401
    expect(status).toBe(200);
  });
});
