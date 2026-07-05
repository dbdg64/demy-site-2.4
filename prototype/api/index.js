const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const { initDb } = require('../db/init');
const queries = require('../db/queries');
const auth = require('../db/auth');
const crud = require('../db/crud');
const media = require('../db/media');

// ── File upload config (lazy init — Vercel has read-only fs except /tmp) ──
const isVercel = !!process.env.VERCEL;

const UPLOAD_DIR = isVercel
  ? path.resolve('/tmp', 'uploads')
  : path.resolve(__dirname, '..', 'public', 'uploads');

// Try to create upload dir; fail gracefully on serverless
let uploadDirReady = false;
try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  uploadDirReady = true;
} catch (_e) {
  console.warn('[UPLOAD] Cannot create uploads directory, using memory storage');
}

// Disk storage (when directory is writable)
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const name = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage: uploadDirReady ? diskStorage : multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|webm|mov|avi/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test((file.mimetype || '').split('/')[1]);
    cb(null, extOk || mimeOk);
  },
});

const app = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'demy-secret-key-2026';

// Static files — Vercel serves from project root, Express serves from ../public/
const publicDir = path.resolve(__dirname, '..', 'public');
const oneYear = 365 * 24 * 60 * 60 * 1000;
const oneMonth = 30 * 24 * 60 * 60 * 1000;
app.use(express.static(publicDir, {
  maxAge: 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.webp') || filePath.endsWith('.jpg') || filePath.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    } else if (filePath.endsWith('.mp4') || filePath.endsWith('.mp3')) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    } else if (filePath.endsWith('.xml') || filePath.endsWith('.txt')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Body parsing
app.use(express.json({ limit: '5mb' }));

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

/* ═══ PING ═══ */
app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

/* ═══ DB STATUS ═══ */
app.get('/api/db-status', async (req, res) => {
  try {
    const dns = require('dns');
    const start = Date.now();

    const ping = await require('../db/pool').query('SELECT 1 AS ok');
    const pingMs = Date.now() - start;

    const counts = await Promise.all([
      require('../db/pool').query("SELECT COUNT(*)::int AS c FROM products"),
      require('../db/pool').query("SELECT COUNT(*)::int AS c FROM categories"),
      require('../db/pool').query("SELECT COUNT(*)::int AS c FROM media"),
      require('../db/pool').query("SELECT COUNT(*)::int AS c FROM users"),
    ]);

    res.json({
      ok: true,
      ping_ms: pingMs,
      counts: {
        products: counts[0].rows[0].c,
        categories: counts[1].rows[0].c,
        media: counts[2].rows[0].c,
        users: counts[3].rows[0].c,
      },
      db_url_host: (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//***@'),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      db_url_host: (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//***@'),
    });
  }
});

/* ═══ AUTH API ═══ */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
    const user = await auth.authenticate(username, password);
    if (!user) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ ...user, token });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/auth/forgot', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    const user = await auth.getUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ username: user.username, name: user.name, securityQuestion: user.securityQuestion });
  } catch (err) {
    console.error('[AUTH] forgot error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/auth/verify-answer', async (req, res) => {
  try {
    const { username, answer } = req.body;
    const ok = await auth.verifySecurityAnswer(username, answer);
    if (!ok) return res.status(400).json({ error: 'الإجابة غير صحيحة' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] verify error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'كلمة المرور قصيرة' });
    const ok = await auth.resetPassword(username, newPassword);
    if (!ok) return res.status(400).json({ error: 'فشل إعادة التعيين' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] reset error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

/* ═══ USERS API (admin only) ═══ */
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await auth.getAllUsers(req.user.username);
    res.json(users);
  } catch (err) {
    console.error('[USERS] list error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await auth.createUser(req.body, req.user.username);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result.user);
  } catch (err) {
    console.error('[USERS] create error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await auth.deleteUser(Number(req.params.id), req.user.username);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  } catch (err) {
    console.error('[USERS] delete error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

/* ═══ PRODUCTS API ═══ */
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let result;
    if (featured === '1') result = await queries.getFeaturedProducts();
    else if (search) result = await queries.searchProducts(search);
    else if (category) result = await queries.getProductsByCategory(category);
    else result = await queries.getAllProducts();
    res.json(result);
  } catch (err) {
    console.error('[PRODUCTS] list error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const product = await queries.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ error: 'not found' });
    res.json(product);
  } catch (err) {
    console.error('[PRODUCTS] get error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const id = await crud.addProduct(req.body);
    const product = await crud.getProductById(id);
    res.status(201).json(product);
  } catch (err) {
    console.error('[PRODUCTS] create error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = await crud.updateProduct(Number(req.params.id), req.body);
    if (!id) return res.status(404).json({ error: 'not found' });
    const product = await crud.getProductById(id);
    res.json(product);
  } catch (err) {
    console.error('[PRODUCTS] update error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const ok = await crud.deleteProduct(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[PRODUCTS] delete error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

/* ═══ Serve uploaded files (from disk or /tmp on Vercel) ═══ */
app.use('/uploads', (req, res, next) => {
  // If running on Vercel, /tmp/uploads is the dir — serve from there
  const filePath = path.join(UPLOAD_DIR, req.path);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  // Fall back to the public dir for pre-existing assets
  next();
});

/* ═══ FILE UPLOAD ═══ */
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });

  // Memory storage fallback — save to disk if possible
  if (req.file.buffer && uploadDirReady) {
    const ext = path.extname(req.file.originalname) || '.bin';
    const name = crypto.randomBytes(12).toString('hex') + ext;
    const dest = path.join(UPLOAD_DIR, name);
    try {
      fs.writeFileSync(dest, req.file.buffer);
      return res.json({ url: '/uploads/' + name, filename: name, size: req.file.size, mimetype: req.file.mimetype });
    } catch (_e) { /* fall through to error */ }
  }

  if (req.file.filename) {
    return res.json({ url: '/uploads/' + req.file.filename, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  }

  res.status(500).json({ error: 'تعذر حفظ الملف. يرجى تكوين وحدة تخزين سحابية (مثل Vercel Blob).' });
});

app.post('/api/upload/multiple', authMiddleware, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'لم يتم رفع ملفات' });

  const results = [];
  for (const f of req.files) {
    let url = '';
    let filename = '';

    if (f.filename) {
      // Disk storage
      filename = f.filename;
      url = '/uploads/' + f.filename;
    } else if (f.buffer && uploadDirReady) {
      // Memory storage — save to disk
      const ext = path.extname(f.originalname) || '.bin';
      filename = crypto.randomBytes(12).toString('hex') + ext;
      const dest = path.join(UPLOAD_DIR, filename);
      try {
        fs.writeFileSync(dest, f.buffer);
        url = '/uploads/' + filename;
      } catch (_e) { /* skip failed file */ }
    }

    if (url) results.push({ url, filename, size: f.size, mimetype: f.mimetype });
  }

  res.json({ files: results });
});

/* ═══ PRODUCT IMAGES ═══ */
app.get('/api/products/:id/images', async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const { rows } = await require('../db/pool').query(
      'SELECT id, path FROM product_images WHERE product_id = $1 ORDER BY sort_order', [pid]
    );
    res.json(rows);
  } catch (err) {
    console.error('[PRODUCT IMAGES] list error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/products/:id/images', authMiddleware, async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const { path: imgPath } = req.body;
    if (!imgPath) return res.status(400).json({ error: 'المسار مطلوب' });
    const { rows } = await require('../db/pool').query(
      'INSERT INTO product_images (product_id, path, sort_order) VALUES ($1, $2, $3) RETURNING id',
      [pid, imgPath, 0]
    );
    res.status(201).json({ id: rows[0].id, path: imgPath });
  } catch (err) {
    console.error('[PRODUCT IMAGES] add error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.delete('/api/products/:id/images/:imgId', authMiddleware, async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const imgId = Number(req.params.imgId);
    const { rowCount } = await require('../db/pool').query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2', [imgId, pid]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[PRODUCT IMAGES] delete error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

/* ═══ MEDIA API ═══ */
app.get('/api/media', async (req, res) => {
  try {
    const { section } = req.query;
    res.json(await media.getAllMedia(section || null));
  } catch (err) {
    console.error('[MEDIA] list error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/media', authMiddleware, async (req, res) => {
  try {
    const id = await media.addMedia(req.body);
    res.status(201).json(await media.getMediaById(id));
  } catch (err) {
    console.error('[MEDIA] create error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.put('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    await media.updateMedia(Number(req.params.id), req.body);
    res.json(await media.getMediaById(Number(req.params.id)));
  } catch (err) {
    console.error('[MEDIA] update error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const ok = await media.deleteMedia(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[MEDIA] delete error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    res.json(await queries.getCategories());
  } catch (err) {
    console.error('[CATEGORIES] list error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

app.get('/api/categories/:slug', async (req, res) => {
  try {
    const cat = await queries.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ error: 'not found' });
    res.json(cat);
  } catch (err) {
    console.error('[CATEGORIES] get error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

/* ═══ HTML Pages ═══ */
const fileMap = {
  '/': 'index.html',
  '/products': 'products.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/awareness': 'awareness.html',
  '/product': 'product.html',
};

// Admin SPA — serve index.html for all /admin/* paths (client-side routing)
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

// Catch-all for HTML pages
app.get('*', (req, res) => {
  const urlPath = req.path.replace(/\/$/, '') || '/';
  const file = fileMap[urlPath];
  if (file) return res.sendFile(path.join(publicDir, file));
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

/* ═══ Error Handler ═══ */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

/* ═══ Startup ═══ */
if (!isVercel) {
  // Local dev — run server directly
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`🏪 ديمى store running → http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/products`);
    });
  }).catch(err => {
    console.error('❌ DB init failed:', err);
    process.exit(1);
  });
}

// Vercel: export the Express app
module.exports = app;

// Vercel cold-start: init DB once before first request
if (isVercel) {
  let dbReady = false;
  let dbInitPromise = null;
  const originalHandler = app.handle.bind(app);
  app.handle = (req, res, next) => {
    if (!dbReady) {
      if (!dbInitPromise) {
        dbInitPromise = initDb().then(() => {
          dbReady = true;
        }).catch(err => {
          console.error('❌ DB init failed:', err);
          dbInitPromise = null;
        });
      }
      return dbInitPromise.then(() => originalHandler(req, res, next)).catch(() => {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
      });
    }
    originalHandler(req, res, next);
  };
}
