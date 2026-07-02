const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db/init');
const queries = require('./db/queries');
const auth = require('./db/auth');
const crud = require('./db/crud');
const media = require('./db/media');

const app = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = 'demy-secret-key-2026';

// Init DB
initDb();

// Body parsing for POST/PUT
app.use(express.json());

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'محاولات كثيرة جداً. حاول بعد ١٥ دقيقة.' }
});
app.use('/api/auth', authLimiter);

/* ═══ JWT Middleware ═══ */
function authMiddleware(req, res, next) {
  const token = req.headers['x-auth'];
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'غير مصرح' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'مدير') return res.status(403).json({ error: 'غير مصرح — صلاحية مدير مطلوبة' });
  next();
}

/* ═══ AUTH API ═══ */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
  const user = auth.authenticate(username, password);
  if (!user) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ ...user, token });
});

app.post('/api/auth/forgot', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
  const user = auth.getUserByUsername(username);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json({ username: user.username, name: user.name, securityQuestion: user.securityQuestion });
});

app.post('/api/auth/verify-answer', (req, res) => {
  const { username, answer } = req.body;
  const ok = auth.verifySecurityAnswer(username, answer);
  if (!ok) return res.status(400).json({ error: 'الإجابة غير صحيحة' });
  res.json({ ok: true });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { username, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'كلمة المرور قصيرة' });
  const ok = auth.resetPassword(username, newPassword);
  if (!ok) return res.status(400).json({ error: 'فشل إعادة التعيين' });
  res.json({ ok: true });
});

/* ═══ USERS API (admin only) ═══ */
app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = auth.getAllUsers(req.user.username);
  res.json(users);
});

app.post('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const result = auth.createUser(req.body, req.user.username);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result.user);
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const result = auth.deleteUser(Number(req.params.id), req.user.username);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true });
});

/* ═══ PRODUCTS API ═══ */
app.get('/api/products', (req, res) => {
  const { category, search, featured } = req.query;
  if (featured === '1') return res.json(queries.getFeaturedProducts());
  if (search) return res.json(queries.searchProducts(search));
  if (category) return res.json(queries.getProductsByCategory(category));
  res.json(queries.getAllProducts());
});

app.get('/api/products/:slug', (req, res) => {
  const product = queries.getProductBySlug(req.params.slug);
  if (!product) return res.status(404).json({ error: 'not found' });
  res.json(product);
});

app.post('/api/products', authMiddleware, (req, res) => {
  const id = crud.addProduct(req.body);
  const product = crud.getProductById(id);
  res.status(201).json(product);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const id = crud.updateProduct(Number(req.params.id), req.body);
  if (!id) return res.status(404).json({ error: 'not found' });
  const product = crud.getProductById(id);
  res.json(product);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const ok = crud.deleteProduct(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

/* ═══ MEDIA API ═══ */
app.get('/api/media', (req, res) => {
  const { section } = req.query;
  res.json(media.getAllMedia(section || null));
});

app.post('/api/media', authMiddleware, (req, res) => {
  const id = media.addMedia(req.body);
  res.status(201).json(media.getMediaById(id));
});

app.put('/api/media/:id', authMiddleware, (req, res) => {
  media.updateMedia(Number(req.params.id), req.body);
  res.json(media.getMediaById(Number(req.params.id)));
});

app.delete('/api/media/:id', authMiddleware, (req, res) => {
  const ok = media.deleteMedia(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

app.get('/api/categories', (req, res) => {
  res.json(queries.getCategories());
});

app.get('/api/categories/:slug', (req, res) => {
  const cat = queries.getCategoryBySlug(req.params.slug);
  if (!cat) return res.status(404).json({ error: 'not found' });
  res.json(cat);
});

/* ═══ STATIC FILES ═══ */
app.use(express.static(path.join(__dirname, 'public')));

const fileMap = {
  '/': 'index.html',
  '/products': 'products.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/awareness': 'awareness.html',
};

app.get('*', (req, res) => {
  const urlPath = req.path.replace(/\/$/, '') || '/';
  const file = fileMap[urlPath];
  if (file) return res.sendFile(path.join(__dirname, 'public', file));
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

/* ═══ Error Handler ═══ */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

app.listen(PORT, () => {
  console.log(`🏪 ديمى store running → http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/products`);
});
