const { describe, it, expect, beforeAll, afterAll, vi } = require('vitest');
const http = require('node:http');
const jwt = require('jsonwebtoken');

// ── Mock DB layer ──
const mockQuery = vi.fn();
const mockAuthenticate = vi.fn();
const mockGetUserByUsername = vi.fn();
const mockVerifySecurityAnswer = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../db/pool', () => ({
  getPool: vi.fn(),
  query: mockQuery,
  end: vi.fn(),
}));

vi.mock('../db/auth', () => ({
  authenticate: mockAuthenticate,
  getUserByUsername: mockGetUserByUsername,
  verifySecurityAnswer: mockVerifySecurityAnswer,
  resetPassword: mockResetPassword,
  isAdmin: vi.fn(),
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('../db/queries', () => ({
  getAllProducts: vi.fn(),
  getProductBySlug: vi.fn(),
}));

vi.mock('../db/crud', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock('../db/media', () => ({
  getAllMedia: vi.fn(),
  createMedia: vi.fn(),
  updateMedia: vi.fn(),
}));

let app;
let server;
let baseUrl;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-for-auth-specs';
  app = require('../api/index');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const addr = server.address();
  baseUrl = `http://localhost:${addr.port}`;
});

afterAll(() => {
  server?.close();
  delete process.env.JWT_SECRET;
});

async function post(path, data) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = res.headers.get('content-type')?.includes('json')
    ? await res.json()
    : await res.text();
  return { status: res.status, body };
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when username is missing', async () => {
    const { status, body } = await post('/api/auth/login', { password: 'secret' });
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when password is missing', async () => {
    const { status, body } = await post('/api/auth/login', { username: 'admin' });
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('returns 401 when credentials are invalid', async () => {
    mockAuthenticate.mockResolvedValue(null);
    const { status, body } = await post('/api/auth/login', {
      username: 'unknown',
      password: 'wrong',
    });
    expect(status).toBe(401);
    expect(body.error).toBeTruthy();
  });

  it('returns a JWT token on successful login', async () => {
    const fakeUser = { id: 1, username: 'admin', name: 'Admin', role: 'مدير' };
    mockAuthenticate.mockResolvedValue(fakeUser);

    const { status, body } = await post('/api/auth/login', {
      username: 'admin',
      password: 'correct-password',
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('user');
    expect(body.user.username).toBe('admin');

    // Verify the token is a valid JWT
    const decoded = jwt.verify(body.token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('username', 'admin');
    expect(decoded).toHaveProperty('role', 'مدير');
  });

  it('calls authenticate with the provided credentials', async () => {
    mockAuthenticate.mockResolvedValue(null);
    await post('/api/auth/login', { username: 'testuser', password: 'testpass' });
    expect(mockAuthenticate).toHaveBeenCalledWith('testuser', 'testpass');
  });
});

describe('POST /api/auth/forgot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when username is missing', async () => {
    const { status } = await post('/api/auth/forgot', {});
    expect(status).toBe(400);
  });

  it('returns 404 for unknown username', async () => {
    mockGetUserByUsername.mockResolvedValue(null);
    const { status, body } = await post('/api/auth/forgot', { username: 'nobody' });
    expect(status).toBe(404);
    expect(body.error).toBeTruthy();
  });

  it('returns the security question for a known user', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      name: 'Admin',
      securityQuestion: 'ما هو اسم والدتك؟',
    });

    const { status, body } = await post('/api/auth/forgot', { username: 'admin' });
    expect(status).toBe(200);
    expect(body).toHaveProperty('question', 'ما هو اسم والدتك؟');
  });
});

describe('POST /api/auth/verify-answer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when username or answer is missing', async () => {
    const { status: s1 } = await post('/api/auth/verify-answer', { answer: 'mom' });
    const { status: s2 } = await post('/api/auth/verify-answer', { username: 'admin' });
    expect(s1).toBe(400);
    expect(s2).toBe(400);
  });

  it('returns 401 for a wrong answer', async () => {
    mockVerifySecurityAnswer.mockResolvedValue(false);
    const { status, body } = await post('/api/auth/verify-answer', {
      username: 'admin',
      answer: 'wrong',
    });
    expect(status).toBe(401);
    expect(body.error).toBeTruthy();
  });

  it('returns a reset token on correct answer', async () => {
    mockVerifySecurityAnswer.mockResolvedValue(true);
    const { status, body } = await post('/api/auth/verify-answer', {
      username: 'admin',
      answer: 'أمي',
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('token');
  });
});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 without required fields', async () => {
    const { status } = await post('/api/auth/reset-password', {});
    expect(status).toBe(400);
  });

  it('rejects weak passwords', async () => {
    const { status, body } = await post('/api/auth/reset-password', {
      token: jwt.sign({ username: 'admin' }, process.env.JWT_SECRET),
      password: 'short',
    });
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('resets password with a valid token and strong password', async () => {
    mockResetPassword.mockResolvedValue(true);
    const token = jwt.sign({ username: 'admin' }, process.env.JWT_SECRET);
    const { status, body } = await post('/api/auth/reset-password', {
      token,
      password: 'new-strong-password-123',
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('ok', true);
    expect(mockResetPassword).toHaveBeenCalledWith('admin', 'new-strong-password-123');
  });
});
