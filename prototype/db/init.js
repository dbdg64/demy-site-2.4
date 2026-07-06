const { query } = require('./pool');
const bcrypt = require('bcryptjs');

async function initDb() {
  // Create schema
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_ar TEXT NOT NULL,
      description_ar TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_slug TEXT NOT NULL REFERENCES categories(slug),
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      featured INTEGER DEFAULT 0,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS product_specs (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      key_ar TEXT NOT NULL,
      value_ar TEXT NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS product_features (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      feature_ar TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS media (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'image',
      file_path TEXT NOT NULL,
      section TEXT DEFAULT 'awareness',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'موظف',
      security_question TEXT NOT NULL DEFAULT 'ما هو اسم والدتك؟',
      security_answer TEXT NOT NULL DEFAULT 'جواب',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Check if already seeded
  const { rows: countRows } = await query('SELECT COUNT(*)::int as c FROM categories');
  if (countRows[0].c > 0) return;

  // Seed data
  const catResult = await query(
    `INSERT INTO categories (slug, name_ar, description_ar, icon, sort_order) VALUES
     ('motor', 'مواتير مياه', '١١ منتج بقدرات مختلفة', 'fa-industry', 1),
     ('submersible', 'غواطس', 'غاطس للآبار ١٫٥ و ٢ حصان', 'fa-water', 2),
     ('flomax', 'فلوماك', 'تحكم أوتوماتيكى لضغط المياه', 'fa-tachometer-alt', 3),
     ('spare', 'قطع غيار', 'بالونات مدورة ٢٤ لتر', 'fa-tools', 4)
     ON CONFLICT DO NOTHING`
  );

  // Seed helper
  async function seedProduct(catSlug, name, slug, featured, image, sort, specs, features, extras) {
    const { rows } = await query(
      `INSERT INTO products (category_slug, name_ar, slug, featured, image, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [catSlug, name, slug, featured ? 1 : 0, image, sort]
    );
    const pid = rows[0]?.id;
    if (!pid) return;

    if (specs) {
      for (const [key, val] of Object.entries(specs)) {
        await query(
          'INSERT INTO product_specs (product_id, key_ar, value_ar) VALUES ($1, $2, $3)',
          [pid, key, val]
        );
      }
    }

    if (features) {
      for (let i = 0; i < features.length; i++) {
        await query(
          'INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES ($1, $2, $3)',
          [pid, features[i], i]
        );
      }
    }

    if (extras) {
      for (let i = 0; i < extras.length; i++) {
        await query(
          'INSERT INTO product_images (product_id, path, sort_order) VALUES ($1, $2, $3)',
          [pid, extras[i], i]
        );
      }
    }
  }

  await seedProduct('motor', 'ماتور ديمى 9000 واحد حصان', 'demy-9000', 1, '../assets/products/demy-9000-main.webp', 1,
    { القوة: '١ حصان', الدفع: 'حتى ٥٤ متر', الملف: 'نحاس ١٠٠٪', الموبينة: '٩ سم', الضمان: '١٢ شهر' },
    ['ملف نحاس', 'موبينة ٩سم', 'اكس استانلس', 'ريشة شفط من النحاس', 'حماية حرارية', 'ريشة توجيه زهر', 'فارغة زهر معزولة من الصدأ', 'موفر للكهرباء', 'مواصفات اوروبية'],
    ['../assets/products/demy-9000-alt.webp', '../assets/products/motor-9000.webp']
  );

  await seedProduct('motor', 'ماتور ميشيل متواضع الجديد', 'michel-new', 0, '../assets/products/michel-new-main.webp', 2,
    { القوة: '١ حصان', الميزة: 'مواصفات أوروبية', الضمان: 'سنتان' }
  );

  await seedProduct('motor', 'ماتور مدفع ٣ حصان ٢ ريشة', 'madfa3-3hp', 0, '../assets/products/madfa3-3hp.webp', 3,
    { القوة: '٣ حصان', الريش: '٢ ريشة', الاستخدام: 'زراعي', الملف: 'نحاس' },
    null,
    ['../assets/products/whatsapp-product.webp']
  );

  await seedProduct('motor', 'موتور زراعى ٢ حصان', 'zira3y-2hp', 0, '../assets/products/product-design22.webp', 4,
    { القوة: '٢ حصان', النوع: 'زراعي إيطالي', مقاوم: 'للصدأ' }
  );

  await seedProduct('motor', 'ماتور شمامة ٢ حصان', 'shamama-2hp', 0, '../assets/products/shamama-2hp-1.webp', 5,
    { القوة: '٢ حصان', النوع: 'شمامة (سطحى)', الاستخدام: 'منزلي وزراعي' }
  );

  await seedProduct('motor', 'ماتور ديمى ٣٠٠', 'demy-300', 0, '../assets/products/demy-300.webp', 6,
    { القوة: '١ حصان', النوع: 'منزلي', الضمان: 'سنتان' }
  );

  await seedProduct('motor', 'ماتور مدفع ١.٥ حصان', 'madfa3-1.5hp', 0, '../assets/products/madfa3-1.5hp.webp', 7,
    { القوة: '١.٥ حصان', النوع: 'مدفع', الملف: 'نحاس' }
  );

  await seedProduct('motor', 'ماتور نصف حصان', 'half-hp', 0, '../assets/products/motor-half-hp.webp', 8,
    { القوة: '٠.٥ حصان', الملف: 'نحاس ١٠٠٪', الاكس: 'استانلس', 'ريشة الشفط': 'نحاس', الاستخدام: 'منزلي' },
    ['ملف نحاس', 'اكس استانلس', 'ريشة الشفط من النحاس', 'حماية حرارية', 'ريشة توجيه زهر']
  );

  await seedProduct('motor', 'ماتور ١ حصان فارغة استانلس', 'stainless-1hp', 0, '../assets/products/motor-1hp-stainless.webp', 9,
    { القوة: '١ حصان', النوع: 'فارغة استانلس', الميزة: 'جسم خارجى استانلس ضد الصدأ' }
  );

  await seedProduct('motor', 'ماتور حركة ٥.٥ حصان سريع', 'fast-5.5hp', 0, '../assets/products/motor-fast-5.5hp.webp', 10,
    { القوة: '٥.٥ حصان', النوع: 'حركة سريع', الاستخدام: 'منزلي وصناعي' }
  );

  await seedProduct('motor', 'ماتور حركة سريع + بطئ', 'fast-slow', 0, '../assets/products/motor-fast-slow.webp', 11,
    { النوع: 'سرعتين (سريع + بطئ)', الملف: 'نحاس', الاستخدام: 'متعدد' }
  );

  await seedProduct('submersible', 'غاطس ديمى ١ حصان', 'submersible-1hp', 0, '../assets/products/submersible-1hp.webp', 1,
    { القوة: '١ حصان', النوع: 'غاطس', الاستخدام: 'آبار وعمق' }
  );

  await seedProduct('submersible', 'غاطس ١.٥ حصان شارب', 'sharp-1.5hp', 0, '../assets/products/submersible-sharp-1.5hp.webp', 2,
    { القوة: '١.٥ حصان', الماركة: 'شارب', الاستخدام: 'آبار' }
  );

  await seedProduct('submersible', 'غاطس شارب ٢ حصان بمفرمة', 'sharp-2hp', 1, '../assets/products/final-product.webp', 3,
    { القوة: '٢ حصان', الماركة: 'شارب', الميزة: 'بمفرمة' }
  );

  await seedProduct('flomax', 'فلوماك ديمى ٩٠٠٠', 'flomax-9000', 0, '../assets/products/flomax-9000-1.webp', 1,
    { النوع: 'فلوماك (DSK-5)', الميزة: 'تحكم أوتوماتيكى', الاستخدام: 'للضغط' }
  );

  await seedProduct('flomax', 'فلوماك ديمى ٩٥٠٠ ديجيتال', 'flomax-9500', 1, '../assets/products/flomax-9500-1.webp', 2,
    { النوع: 'فلوماك ديجيتال (DSK-15)', المواصفات: 'إلكترونى بالكامل', الميزة: 'Digital Press Control' },
    null,
    ['../assets/products/flomax-9500-2.webp']
  );

  await seedProduct('spare', 'بالونة مدورة ٢٤ لتر', 'balloon-24l', 0, '../assets/products/balloon-24l.webp', 1,
    { السعة: '٢٤ لتر', النوع: 'بالونة مدورة', الاستخدام: 'قطع غيار مواتير' }
  );

  // Seed default users
  const { rows: userCount } = await query('SELECT COUNT(*)::int as c FROM users');
  if (userCount[0].c === 0) {
    const [adminPw, empPw, adminAnswer, empAnswer] = await Promise.all([
      bcrypt.hash('admin123', 10),
      bcrypt.hash('demy2026', 10),
      bcrypt.hash('فاطمة'.toLowerCase().trim(), 10),
      bcrypt.hash('أزرق'.toLowerCase().trim(), 10),
    ]);
    await query(
      `INSERT INTO users (username, password, name, role, security_question, security_answer) VALUES
       ('admin', $1, 'أحمد', 'مدير', 'ما هو اسم والدتك؟', $3),
       ('employee', $2, 'محمد', 'موظف', 'ما هو لونك المفضل؟', $4)`,
      [adminPw, empPw, adminAnswer, empAnswer]
    );
    console.log('✅ Default users seeded');
  }

  // Seed media
  const { rows: mediaCount } = await query('SELECT COUNT(*)::int as c FROM media');
  if (mediaCount[0].c === 0) {
    await query(
      `INSERT INTO media (title, description, type, file_path, section, sort_order) VALUES
       ('مقارنة مواتير المياه', 'مقارنة شاملة بين قدرات المواتير المختلفة', 'video', '/videos/AI_presenter_compares_devicesFULL.mp4', 'awareness', 1),
       ('أهمية الفلوماك', 'ليه الفلوماك ضروري لماتور المياه', 'video', '/videos/importance-of-flomak.mp4', 'awareness', 2)`
    );
    console.log('✅ Media seeded');
  }

  const { rows: productCount } = await query('SELECT COUNT(*)::int as c FROM products');
  console.log(`✅ DB seeded: ${productCount[0].c} products`);
}

module.exports = { initDb };
