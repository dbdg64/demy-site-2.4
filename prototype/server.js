// Local dev server — wraps the Vercel serverless function for local use
const app = require('./api/index');
const { initDb } = require('./db/init');

const PORT = process.env.PORT || 3003;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🏪 ديمى store → http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/products`);
    console.log(`   Admin: http://localhost:${PORT}/admin/`);
  });
}).catch(err => {
  console.error('❌ DB init failed:', err);
  process.exit(1);
});
