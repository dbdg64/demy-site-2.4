const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'store.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_ar TEXT NOT NULL,
      description_ar TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_slug TEXT NOT NULL REFERENCES categories(slug),
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      featured INTEGER DEFAULT 0,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      key_ar TEXT NOT NULL,
      value_ar TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      feature_ar TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'موظف',
      security_question TEXT NOT NULL DEFAULT 'ما هو اسم والدتك؟',
      security_answer TEXT NOT NULL DEFAULT 'جواب',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Check if data already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (count.c > 0) return;

  const insertCategory = db.prepare(
    'INSERT INTO categories (slug, name_ar, description_ar, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertProduct = db.prepare(
    'INSERT INTO products (category_slug, name_ar, slug, featured, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertSpec = db.prepare(
    'INSERT INTO product_specs (product_id, key_ar, value_ar) VALUES (?, ?, ?)'
  );
  const insertFeature = db.prepare(
    'INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES (?, ?, ?)'
  );
  const insertImage = db.prepare(
    'INSERT INTO product_images (product_id, path, sort_order) VALUES (?, ?, ?)'
  );

  const seed = db.transaction(() => {
    // Categories
    insertCategory.run('motor', 'مواتير مياه', '١١ منتج بقدرات مختلفة', 'fa-industry', 1);
    insertCategory.run('submersible', 'غواطس', 'غاطس للآبار ١٫٥ و ٢ حصان', 'fa-water', 2);
    insertCategory.run('flomax', 'فلوماك', 'تحكم أوتوماتيكى لضغط المياه', 'fa-tachometer-alt', 3);
    insertCategory.run('spare', 'قطع غيار', 'بالونات مدورة ٢٤ لتر', 'fa-tools', 4);

    // Helper to seed a product
    function seedProduct(catSlug, name, slug, featured, image, sort, specs, features, extras) {
      const info = insertProduct.run(catSlug, name, slug, featured ? 1 : 0, image, sort);
      const pid = info.lastInsertRowid;

      if (specs) {
        const keys = Object.keys(specs);
        for (let k = 0; k < keys.length; k++) {
          insertSpec.run(pid, keys[k], specs[keys[k]]);
        }
      }

      if (features) {
        for (let f = 0; f < features.length; f++) {
          insertFeature.run(pid, features[f], f);
        }
      }

      if (extras) {
        for (let e = 0; e < extras.length; e++) {
          insertImage.run(pid, extras[e], e);
        }
      }
    }

    seedProduct('motor', 'ماتور ديمى 9000 واحد حصان', 'demy-9000', 1, '../assets/products/demy-9000-main.webp', 1,
      { القوة: '١ حصان', الدفع: 'حتى ٥٤ متر', الملف: 'نحاس ١٠٠٪', الموبينة: '٩ سم', الضمان: '١٢ شهر' },
      ['ملف نحاس', 'موبينة ٩سم', 'اكس استانلس', 'ريشة شفط من النحاس', 'حماية حرارية', 'ريشة توجيه زهر', 'فارغة زهر معزولة من الصدأ', 'موفر للكهرباء', 'مواصفات اوروبية'],
      ['../assets/products/demy-9000-alt.webp', '../assets/products/motor-9000.webp']
    );

    seedProduct('motor', 'ماتور ميشيل متواضع الجديد', 'michel-new', 0, '../assets/products/michel-new-main.webp', 2,
      { القوة: '١ حصان', الميزة: 'مواصفات أوروبية', الضمان: 'سنتان' }
    );

    seedProduct('motor', 'ماتور مدفع ٣ حصان ٢ ريشة', 'madfa3-3hp', 0, '../assets/products/madfa3-3hp.webp', 3,
      { القوة: '٣ حصان', الريش: '٢ ريشة', الاستخدام: 'زراعي', الملف: 'نحاس' },
      null,
      ['../assets/products/whatsapp-product.webp']
    );

    seedProduct('motor', 'موتور زراعى ٢ حصان', 'zira3y-2hp', 0, '../assets/products/product-design22.webp', 4,
      { القوة: '٢ حصان', النوع: 'زراعي إيطالي', مقاوم: 'للصدأ' }
    );

    seedProduct('motor', 'ماتور شمامة ٢ حصان', 'shamama-2hp', 0, '../assets/products/shamama-2hp-1.webp', 5,
      { القوة: '٢ حصان', النوع: 'شمامة (سطحى)', الاستخدام: 'منزلي وزراعي' }
    );

    seedProduct('motor', 'ماتور ديمى ٣٠٠', 'demy-300', 0, '../assets/products/demy-300.webp', 6,
      { القوة: '١ حصان', النوع: 'منزلي', الضمان: 'سنتان' }
    );

    seedProduct('motor', 'ماتور مدفع ١.٥ حصان', 'madfa3-1.5hp', 0, '../assets/products/madfa3-1.5hp.webp', 7,
      { القوة: '١.٥ حصان', النوع: 'مدفع', الملف: 'نحاس' }
    );

    seedProduct('motor', 'ماتور نصف حصان', 'half-hp', 0, '../assets/products/motor-half-hp.webp', 8,
      { القوة: '٠.٥ حصان', الملف: 'نحاس ١٠٠٪', الاكس: 'استانلس', 'ريشة الشفط': 'نحاس', الاستخدام: 'منزلي' },
      ['ملف نحاس', 'اكس استانلس', 'ريشة الشفط من النحاس', 'حماية حرارية', 'ريشة توجيه زهر']
    );

    seedProduct('motor', 'ماتور ١ حصان فارغة استانلس', 'stainless-1hp', 0, '../assets/products/motor-1hp-stainless.webp', 9,
      { القوة: '١ حصان', النوع: 'فارغة استانلس', الميزة: 'جسم خارجى استانلس ضد الصدأ' }
    );

    seedProduct('motor', 'ماتور حركة ٥.٥ حصان سريع', 'fast-5.5hp', 0, '../assets/products/motor-fast-5.5hp.webp', 10,
      { القوة: '٥.٥ حصان', النوع: 'حركة سريع', الاستخدام: 'منزلي وصناعي' }
    );

    seedProduct('motor', 'ماتور حركة سريع + بطئ', 'fast-slow', 0, '../assets/products/motor-fast-slow.webp', 11,
      { النوع: 'سرعتين (سريع + بطئ)', الملف: 'نحاس', الاستخدام: 'متعدد' }
    );

    seedProduct('submersible', 'غاطس ديمى ١ حصان', 'submersible-1hp', 0, '../assets/products/submersible-1hp.webp', 1,
      { القوة: '١ حصان', النوع: 'غاطس', الاستخدام: 'آبار وعمق' }
    );

    seedProduct('submersible', 'غاطس ١.٥ حصان شارب', 'sharp-1.5hp', 0, '../assets/products/submersible-sharp-1.5hp.webp', 2,
      { القوة: '١.٥ حصان', الماركة: 'شارب', الاستخدام: 'آبار' }
    );

    seedProduct('submersible', 'غاطس شارب ٢ حصان بمفرمة', 'sharp-2hp', 1, '../assets/products/final-product.webp', 3,
      { القوة: '٢ حصان', الماركة: 'شارب', الميزة: 'بمفرمة' }
    );

    seedProduct('flomax', 'فلوماك ديمى ٩٠٠٠', 'flomax-9000', 0, '../assets/products/flomax-9000-1.webp', 1,
      { النوع: 'فلوماك (DSK-5)', الميزة: 'تحكم أوتوماتيكى', الاستخدام: 'للضغط' }
    );

    seedProduct('flomax', 'فلوماك ديمى ٩٥٠٠ ديجيتال', 'flomax-9500', 1, '../assets/products/flomax-9500-1.webp', 2,
      { النوع: 'فلوماك ديجيتال (DSK-15)', المواصفات: 'إلكترونى بالكامل', الميزة: 'Digital Press Control' },
      null,
      ['../assets/products/flomax-9500-2.webp']
    );

    seedProduct('spare', 'بالونة مدورة ٢٤ لتر', 'balloon-24l', 0, '../assets/products/balloon-24l.webp', 1,
      { السعة: '٢٤ لتر', النوع: 'بالونة مدورة', الاستخدام: 'قطع غيار مواتير' }
    );

    // Seed default admin user
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    if (userCount === 0) {
      const ins = db.prepare('INSERT INTO users (username, password, name, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)');
      ins.run('admin', bcrypt.hashSync('admin123', 10), 'أحمد', 'مدير', 'ما هو اسم والدتك؟', 'فاطمة');
      ins.run('employee', bcrypt.hashSync('demy2026', 10), 'محمد', 'موظف', 'ما هو لونك المفضل؟', 'أزرق');
      console.log('✅ Default users seeded');
    }
  });

  seed();
  console.log('✅ DB seeded: ' + db.prepare('SELECT COUNT(*) as c FROM products').get().c + ' products');
}

module.exports = { getDb, initDb };
