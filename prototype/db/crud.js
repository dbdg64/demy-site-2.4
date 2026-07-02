const { getDb } = require('./init');
const { enrichProduct } = require('./queries');

function addProduct(data) {
  const db = getDb();
  const slug = data.slug || data.name_ar.replace(/\s+/g, '-').toLowerCase();
  const info = db.prepare(
    'INSERT INTO products (category_slug, name_ar, slug, featured, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.category_slug, data.name_ar, slug, data.featured ? 1 : 0, data.image || '', data.sort_order || 0);
  const pid = info.lastInsertRowid;

  // Insert specs
  if (data.specs && typeof data.specs === 'object') {
    const ins = db.prepare('INSERT INTO product_specs (product_id, key_ar, value_ar) VALUES (?, ?, ?)');
    for (const key of Object.keys(data.specs)) {
      ins.run(pid, key, data.specs[key]);
    }
  }

  // Insert features / description as a feature
  if (data.features && Array.isArray(data.features)) {
    const ins = db.prepare('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES (?, ?, ?)');
    data.features.forEach((f, i) => ins.run(pid, f, i));
  }
  if (data.description) {
    db.prepare('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES (?, ?, ?)')
      .run(pid, data.description, 999);
  }

  return pid;
}

function updateProduct(id, data) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return null;
  db.prepare(`
    UPDATE products SET category_slug = ?, name_ar = ?, featured = ?, image = ?, sort_order = ?
    WHERE id = ?
  `).run(data.category_slug, data.name_ar, data.featured ? 1 : 0, data.image || '', data.sort_order || 0, id);

  // Replace specs: delete old, insert new
  if (data.specs && typeof data.specs === 'object') {
    db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(id);
    const ins = db.prepare('INSERT INTO product_specs (product_id, key_ar, value_ar) VALUES (?, ?, ?)');
    for (const key of Object.keys(data.specs)) {
      ins.run(id, key, data.specs[key]);
    }
  }

  // Replace features
  if (data.features && Array.isArray(data.features)) {
    db.prepare('DELETE FROM product_features WHERE product_id = ?').run(id);
    const ins = db.prepare('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES (?, ?, ?)');
    data.features.forEach((f, i) => ins.run(id, f, i));
  }
  if (data.description) {
    db.prepare('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES (?, ?, ?)')
      .run(id, data.description, 999);
  }

  return id;
}

function deleteProduct(id) {
  const db = getDb();
  const r = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return r.changes > 0;
}

function getProductById(id) {
  const db = getDb();
  const row = db.prepare(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p WHERE p.id = ?
  `).get(id);
  return row ? enrichProduct(row) : null;
}

module.exports = { addProduct, updateProduct, deleteProduct, getProductById };
