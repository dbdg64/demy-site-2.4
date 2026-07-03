-- Schema from prototype/db/init.js — run this entire block in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

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

CREATE TABLE IF NOT EXISTS product_specs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key_ar TEXT NOT NULL,
  value_ar TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_features (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature_ar TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

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
