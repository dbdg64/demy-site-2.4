#!/usr/bin/env node
// scripts/seed.js — seed Supabase with categories, products, media, users
// Usage: DATABASE_URL="postgresql://..." node scripts/seed.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  console.log('🌱 Seeding database...');

  // Categories
  await query(`INSERT INTO categories (slug, name_ar, description_ar, icon, sort_order) VALUES
   ('motor', 'مواتير مياه', '١١ منتج بقدرات مختلفة', 'fa-industry', 1),
   ('submersible', 'غواطس', 'غاطس للآبار ١٫٥ و ٢ حصان', 'fa-water', 2),
   ('flomax', 'فلوماك', 'تحكم أوتوماتيكى لضغط المياه', 'fa-tachometer-alt', 3),
   ('spare', 'قطع غيار', 'بالونات مدورة ٢٤ لتر', 'fa-tools', 4)
   ON CONFLICT (slug) DO NOTHING`);

  // Products
  const products = [
    ['motor', 'ماتور ديمى 9000 واحد حصان', 'demy-9000', 1, '../assets/products/demy-9000-main.webp', 1],
    ['motor', 'ماتور ميشيل متواضع الجديد', 'michel-new', 0, '../assets/products/michel-new-main.webp', 2],
    ['motor', 'ماتور مدفع ٣ حصان ٢ ريشة', 'madfa3-3hp', 0, '../assets/products/madfa3-3hp.webp', 3],
    ['motor', 'موتور زراعى ٢ حصان', 'zira3y-2hp', 0, '../assets/products/product-design22.webp', 4],
    ['motor', 'ماتور شمامة ٢ حصان', 'shamama-2hp', 0, '../assets/products/shamama-2hp-1.webp', 5],
    ['motor', 'ماتور ديمى ٣٠٠', 'demy-300', 0, '../assets/products/demy-300.webp', 6],
    ['motor', 'ماتور مدفع ١.٥ حصان', 'madfa3-1.5hp', 0, '../assets/products/madfa3-1.5hp.webp', 7],
    ['motor', 'ماتور نصف حصان', 'half-hp', 0, '../assets/products/motor-half-hp.webp', 8],
    ['motor', 'ماتور ١ حصان فارغة استانلس', 'stainless-1hp', 0, '../assets/products/motor-1hp-stainless.webp', 9],
    ['motor', 'ماتور حركة ٥.٥ حصان سريع', 'fast-5.5hp', 0, '../assets/products/motor-fast-5.5hp.webp', 10],
    ['motor', 'ماتور حركة سريع + بطئ', 'fast-slow', 0, '../assets/products/motor-fast-slow.webp', 11],
    ['submersible', 'غاطس ديمى ١ حصان', 'submersible-1hp', 0, '../assets/products/submersible-1hp.webp', 1],
    ['submersible', 'غاطس ١.٥ حصان شارب', 'sharp-1.5hp', 0, '../assets/products/submersible-sharp-1.5hp.webp', 2],
    ['submersible', 'غاطس شارب ٢ حصان بمفرمة', 'sharp-2hp', 1, '../assets/products/final-product.webp', 3],
    ['flomax', 'فلوماك ديمى ٩٠٠٠', 'flomax-9000', 0, '../assets/products/flomax-9000-1.webp', 1],
    ['flomax', 'فلوماك ديمى ٩٥٠٠ ديجيتال', 'flomax-9500', 1, '../assets/products/flomax-9500-1.webp', 2],
    ['spare', 'بالونة مدورة ٢٤ لتر', 'balloon-24l', 0, '../assets/products/balloon-24l.webp', 1],
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (category_slug, name_ar, slug, featured, image, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO NOTHING`,
      p
    );
  }

  // Specs
  const specs = [
    ['demy-9000', 'القوة', '١ حصان'], ['demy-9000', 'الدفع', 'حتى ٥٤ متر'], ['demy-9000', 'الملف', 'نحاس ١٠٠٪'], ['demy-9000', 'الموبينة', '٩ سم'], ['demy-9000', 'الضمان', '١٢ شهر'],
    ['michel-new', 'القوة', '١ حصان'], ['michel-new', 'الميزة', 'مواصفات أوروبية'], ['michel-new', 'الضمان', 'سنتان'],
    ['madfa3-3hp', 'القوة', '٣ حصان'], ['madfa3-3hp', 'الريش', '٢ ريشة'], ['madfa3-3hp', 'الاستخدام', 'زراعي'], ['madfa3-3hp', 'الملف', 'نحاس'],
    ['zira3y-2hp', 'القوة', '٢ حصان'], ['zira3y-2hp', 'النوع', 'زراعي إيطالي'], ['zira3y-2hp', 'مقاوم', 'للصدأ'],
    ['shamama-2hp', 'القوة', '٢ حصان'], ['shamama-2hp', 'النوع', 'شمامة (سطحى)'], ['shamama-2hp', 'الاستخدام', 'منزلي وزراعي'],
    ['demy-300', 'القوة', '١ حصان'], ['demy-300', 'النوع', 'منزلي'], ['demy-300', 'الضمان', 'سنتان'],
    ['madfa3-1.5hp', 'القوة', '١.٥ حصان'], ['madfa3-1.5hp', 'النوع', 'مدفع'], ['madfa3-1.5hp', 'الملف', 'نحاس'],
    ['half-hp', 'القوة', '٠.٥ حصان'], ['half-hp', 'الملف', 'نحاس ١٠٠٪'], ['half-hp', 'الاكس', 'استانلس'], ['half-hp', 'ريشة الشفط', 'نحاس'], ['half-hp', 'الاستخدام', 'منزلي'],
    ['stainless-1hp', 'القوة', '١ حصان'], ['stainless-1hp', 'النوع', 'فارغة استانلس'], ['stainless-1hp', 'الميزة', 'جسم خارجى استانلس ضد الصدأ'],
    ['fast-5.5hp', 'القوة', '٥.٥ حصان'], ['fast-5.5hp', 'النوع', 'حركة سريع'], ['fast-5.5hp', 'الاستخدام', 'منزلي وصناعي'],
    ['fast-slow', 'النوع', 'سرعتين (سريع + بطئ)'], ['fast-slow', 'الملف', 'نحاس'], ['fast-slow', 'الاستخدام', 'متعدد'],
    ['submersible-1hp', 'القوة', '١ حصان'], ['submersible-1hp', 'النوع', 'غاطس'], ['submersible-1hp', 'الاستخدام', 'آبار وعمق'],
    ['sharp-1.5hp', 'القوة', '١.٥ حصان'], ['sharp-1.5hp', 'الماركة', 'شارب'], ['sharp-1.5hp', 'الاستخدام', 'آبار'],
    ['sharp-2hp', 'القوة', '٢ حصان'], ['sharp-2hp', 'الماركة', 'شارب'], ['sharp-2hp', 'الميزة', 'بمفرمة'],
    ['flomax-9000', 'النوع', 'فلوماك (DSK-5)'], ['flomax-9000', 'الميزة', 'تحكم أوتوماتيكى'], ['flomax-9000', 'الاستخدام', 'للضغط'],
    ['flomax-9500', 'النوع', 'فلوماك ديجيتال (DSK-15)'], ['flomax-9500', 'المواصفات', 'إلكترونى بالكامل'], ['flomax-9500', 'الميزة', 'Digital Press Control'],
    ['balloon-24l', 'السعة', '٢٤ لتر'], ['balloon-24l', 'النوع', 'بالونة مدورة'], ['balloon-24l', 'الاستخدام', 'قطع غيار مواتير'],
  ];

  for (const [slug, key, val] of specs) {
    await query(
      `INSERT INTO product_specs (product_id, key_ar, value_ar)
       SELECT id, $1, $2 FROM products WHERE slug = $3`,
      [key, val, slug]
    );
  }

  // Features
  const features = [
    ['demy-9000', 'ملف نحاس'], ['demy-9000', 'موبينة ٩سم'], ['demy-9000', 'اكس استانلس'],
    ['demy-9000', 'ريشة شفط من النحاس'], ['demy-9000', 'حماية حرارية'], ['demy-9000', 'ريشة توجيه زهر'],
    ['demy-9000', 'فارغة زهر معزولة من الصدأ'], ['demy-9000', 'موفر للكهرباء'], ['demy-9000', 'مواصفات اوروبية'],
    ['half-hp', 'ملف نحاس'], ['half-hp', 'اكس استانلس'], ['half-hp', 'ريشة الشفط من النحاس'],
    ['half-hp', 'حماية حرارية'], ['half-hp', 'ريشة توجيه زهر'],
  ];

  for (const [slug, feat] of features) {
    await query(
      `INSERT INTO product_features (product_id, feature_ar, sort_order)
       SELECT id, $1, $2 FROM products WHERE slug = $3`,
      [feat, features.indexOf([slug, feat]), slug]
    );
  }

  // Images
  const images = [
    ['demy-9000', '../assets/products/demy-9000-alt.webp'],
    ['demy-9000', '../assets/products/motor-9000.webp'],
    ['madfa3-3hp', '../assets/products/whatsapp-product.webp'],
    ['flomax-9500', '../assets/products/flomax-9500-2.webp'],
  ];

  for (const [slug, path] of images) {
    await query(
      `INSERT INTO product_images (product_id, path, sort_order)
       SELECT id, $1, $2 FROM products WHERE slug = $3`,
      [path, images.indexOf([slug, path]), slug]
    );
  }

  // Users with real bcrypt hashes
  const adminPw = bcrypt.hashSync('admin123', 10);
  const empPw = bcrypt.hashSync('demy2026', 10);
  await query(
    `INSERT INTO users (username, password, name, role, security_question, security_answer) VALUES
     ('admin', $1, 'أحمد', 'مدير', 'ما هو اسم والدتك؟', 'فاطمة'),
     ('employee', $2, 'محمد', 'موظف', 'ما هو لونك المفضل؟', 'أزرق')
     ON CONFLICT (username) DO NOTHING`,
    [adminPw, empPw]
  );

  // Media
  await query(
    `INSERT INTO media (title, description, type, file_path, section, sort_order) VALUES
     ('مقارنة مواتير المياه', 'مقارنة شاملة بين قدرات المواتير المختلفة', 'video', '/videos/AI_presenter_compares_devicesFULL.mp4', 'awareness', 1),
     ('أهمية الفلوماك', 'ليه الفلوماك ضروري لماتور المياه', 'video', '/videos/importance-of-flomak.mp4', 'awareness', 2)
     ON CONFLICT DO NOTHING`
  );

  // Count
  const { rows } = await query('SELECT COUNT(*)::int as c FROM products');
  console.log(`✅ Seeded ${rows[0].c} products`);
  console.log('✅ Done');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
