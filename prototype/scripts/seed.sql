-- Drop seed data if re-running (keeps idempotency)
TRUNCATE product_images, product_features, product_specs, products, categories, media, users RESTART IDENTITY CASCADE;

-- Categories
INSERT INTO categories (slug, name_ar, description_ar, icon, sort_order) VALUES
 ('motor', 'مواتير مياه', '١١ منتج بقدرات مختلفة', 'fa-industry', 1),
 ('submersible', 'غواطس', 'غاطس للآبار ١٫٥ و ٢ حصان', 'fa-water', 2),
 ('flomax', 'فلوماك', 'تحكم أوتوماتيكى لضغط المياه', 'fa-tachometer-alt', 3),
 ('spare', 'قطع غيار', 'بالونات مدورة ٢٤ لتر', 'fa-tools', 4);

-- Helper: insert products with ids for FK inserts
-- motor products
INSERT INTO products (category_slug, name_ar, slug, featured, image, sort_order) VALUES
 ('motor', 'ماتور ديمى 9000 واحد حصان', 'demy-9000', 1, '../assets/products/demy-9000-main.webp', 1),
 ('motor', 'ماتور ميشيل متواضع الجديد', 'michel-new', 0, '../assets/products/michel-new-main.webp', 2),
 ('motor', 'ماتور مدفع ٣ حصان ٢ ريشة', 'madfa3-3hp', 0, '../assets/products/madfa3-3hp.webp', 3),
 ('motor', 'موتور زراعى ٢ حصان', 'zira3y-2hp', 0, '../assets/products/product-design22.webp', 4),
 ('motor', 'ماتور شمامة ٢ حصان', 'shamama-2hp', 0, '../assets/products/shamama-2hp-1.webp', 5),
 ('motor', 'ماتور ديمى ٣٠٠', 'demy-300', 0, '../assets/products/demy-300.webp', 6),
 ('motor', 'ماتور مدفع ١.٥ حصان', 'madfa3-1.5hp', 0, '../assets/products/madfa3-1.5hp.webp', 7),
 ('motor', 'ماتور نصف حصان', 'half-hp', 0, '../assets/products/motor-half-hp.webp', 8),
 ('motor', 'ماتور ١ حصان فارغة استانلس', 'stainless-1hp', 0, '../assets/products/motor-1hp-stainless.webp', 9),
 ('motor', 'ماتور حركة ٥.٥ حصان سريع', 'fast-5.5hp', 0, '../assets/products/motor-fast-5.5hp.webp', 10),
 ('motor', 'ماتور حركة سريع + بطئ', 'fast-slow', 0, '../assets/products/motor-fast-slow.webp', 11),
 ('submersible', 'غاطس ديمى ١ حصان', 'submersible-1hp', 0, '../assets/products/submersible-1hp.webp', 1),
 ('submersible', 'غاطس ١.٥ حصان شارب', 'sharp-1.5hp', 0, '../assets/products/submersible-sharp-1.5hp.webp', 2),
 ('submersible', 'غاطس شارب ٢ حصان بمفرمة', 'sharp-2hp', 1, '../assets/products/final-product.webp', 3),
 ('flomax', 'فلوماك ديمى ٩٠٠٠', 'flomax-9000', 0, '../assets/products/flomax-9000-1.webp', 1),
 ('flomax', 'فلوماك ديمى ٩٥٠٠ ديجيتال', 'flomax-9500', 1, '../assets/products/flomax-9500-1.webp', 2),
 ('spare', 'بالونة مدورة ٢٤ لتر', 'balloon-24l', 0, '../assets/products/balloon-24l.webp', 1);

-- Product specs
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١ حصان' FROM products WHERE slug='demy-9000';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الدفع', 'حتى ٥٤ متر' FROM products WHERE slug='demy-9000';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الملف', 'نحاس ١٠٠٪' FROM products WHERE slug='demy-9000';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الموبينة', '٩ سم' FROM products WHERE slug='demy-9000';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الضمان', '١٢ شهر' FROM products WHERE slug='demy-9000';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١ حصان' FROM products WHERE slug='michel-new';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الميزة', 'مواصفات أوروبية' FROM products WHERE slug='michel-new';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الضمان', 'سنتان' FROM products WHERE slug='michel-new';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '٣ حصان' FROM products WHERE slug='madfa3-3hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الريش', '٢ ريشة' FROM products WHERE slug='madfa3-3hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'زراعي' FROM products WHERE slug='madfa3-3hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الملف', 'نحاس' FROM products WHERE slug='madfa3-3hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '٢ حصان' FROM products WHERE slug='zira3y-2hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'زراعي إيطالي' FROM products WHERE slug='zira3y-2hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'مقاوم', 'للصدأ' FROM products WHERE slug='zira3y-2hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '٢ حصان' FROM products WHERE slug='shamama-2hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'شمامة (سطحى)' FROM products WHERE slug='shamama-2hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'منزلي وزراعي' FROM products WHERE slug='shamama-2hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١ حصان' FROM products WHERE slug='demy-300';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'منزلي' FROM products WHERE slug='demy-300';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الضمان', 'سنتان' FROM products WHERE slug='demy-300';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١.٥ حصان' FROM products WHERE slug='madfa3-1.5hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'مدفع' FROM products WHERE slug='madfa3-1.5hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الملف', 'نحاس' FROM products WHERE slug='madfa3-1.5hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '٠.٥ حصان' FROM products WHERE slug='half-hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الملف', 'نحاس ١٠٠٪' FROM products WHERE slug='half-hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاكس', 'استانلس' FROM products WHERE slug='half-hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'ريشة الشفط', 'نحاس' FROM products WHERE slug='half-hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'منزلي' FROM products WHERE slug='half-hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١ حصان' FROM products WHERE slug='stainless-1hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'فارغة استانلس' FROM products WHERE slug='stainless-1hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الميزة', 'جسم خارجى استانلس ضد الصدأ' FROM products WHERE slug='stainless-1hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '٥.٥ حصان' FROM products WHERE slug='fast-5.5hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'حركة سريع' FROM products WHERE slug='fast-5.5hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'منزلي وصناعي' FROM products WHERE slug='fast-5.5hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'سرعتين (سريع + بطئ)' FROM products WHERE slug='fast-slow';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الملف', 'نحاس' FROM products WHERE slug='fast-slow';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'متعدد' FROM products WHERE slug='fast-slow';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١ حصان' FROM products WHERE slug='submersible-1hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'غاطس' FROM products WHERE slug='submersible-1hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'آبار وعمق' FROM products WHERE slug='submersible-1hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '١.٥ حصان' FROM products WHERE slug='sharp-1.5hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الماركة', 'شارب' FROM products WHERE slug='sharp-1.5hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'آبار' FROM products WHERE slug='sharp-1.5hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'القوة', '٢ حصان' FROM products WHERE slug='sharp-2hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الماركة', 'شارب' FROM products WHERE slug='sharp-2hp';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الميزة', 'بمفرمة' FROM products WHERE slug='sharp-2hp';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'فلوماك (DSK-5)' FROM products WHERE slug='flomax-9000';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الميزة', 'تحكم أوتوماتيكى' FROM products WHERE slug='flomax-9000';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'للضغط' FROM products WHERE slug='flomax-9000';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'فلوماك ديجيتال (DSK-15)' FROM products WHERE slug='flomax-9500';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'المواصفات', 'إلكترونى بالكامل' FROM products WHERE slug='flomax-9500';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الميزة', 'Digital Press Control' FROM products WHERE slug='flomax-9500';

INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'السعة', '٢٤ لتر' FROM products WHERE slug='balloon-24l';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'النوع', 'بالونة مدورة' FROM products WHERE slug='balloon-24l';
INSERT INTO product_specs (product_id, key_ar, value_ar) SELECT id, 'الاستخدام', 'قطع غيار مواتير' FROM products WHERE slug='balloon-24l';

-- Product features
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'ملف نحاس', 0 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'موبينة ٩سم', 1 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'اكس استانلس', 2 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'ريشة شفط من النحاس', 3 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'حماية حرارية', 4 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'ريشة توجيه زهر', 5 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'فارغة زهر معزولة من الصدأ', 6 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'موفر للكهرباء', 7 FROM products WHERE slug='demy-9000';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'مواصفات اوروبية', 8 FROM products WHERE slug='demy-9000';

INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'ملف نحاس', 0 FROM products WHERE slug='half-hp';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'اكس استانلس', 1 FROM products WHERE slug='half-hp';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'ريشة الشفط من النحاس', 2 FROM products WHERE slug='half-hp';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'حماية حرارية', 3 FROM products WHERE slug='half-hp';
INSERT INTO product_features (product_id, feature_ar, sort_order) SELECT id, 'ريشة توجيه زهر', 4 FROM products WHERE slug='half-hp';

-- Product images
INSERT INTO product_images (product_id, path, sort_order) SELECT id, '../assets/products/demy-9000-alt.webp', 0 FROM products WHERE slug='demy-9000';
INSERT INTO product_images (product_id, path, sort_order) SELECT id, '../assets/products/motor-9000.webp', 1 FROM products WHERE slug='demy-9000';
INSERT INTO product_images (product_id, path, sort_order) SELECT id, '../assets/products/whatsapp-product.webp', 0 FROM products WHERE slug='madfa3-3hp';
INSERT INTO product_images (product_id, path, sort_order) SELECT id, '../assets/products/flomax-9500-2.webp', 0 FROM products WHERE slug='flomax-9500';

-- Users (bcrypt hashes from original code)
INSERT INTO users (username, password, name, role, security_question, security_answer) VALUES
 ('admin', '$2a$10$7QqcqGUEbi7d9T3sJq.ZvOIv5Y.5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'أحمد', 'مدير', 'ما هو اسم والدتك؟', 'فاطمة'),
 ('employee', '$2a$10$X9s3K8vM2rQ5wE7hJ9lL3nP6tY8uV2bC4dF6gH0jK1lM3nO5pQ8rS', 'محمد', 'موظف', 'ما هو لونك المفضل؟', 'أزرق');

-- Media
INSERT INTO media (title, description, type, file_path, section, sort_order) VALUES
 ('مقارنة مواتير المياه', 'مقارنة شاملة بين قدرات المواتير المختلفة', 'video', '/videos/AI_presenter_compares_devicesFULL.mp4', 'awareness', 1),
 ('أهمية الفلوماك', 'ليه الفلوماك ضروري لماتور المياه', 'video', '/videos/importance-of-flomak.mp4', 'awareness', 2);
