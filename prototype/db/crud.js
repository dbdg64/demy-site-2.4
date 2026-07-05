const { query } = require('./pool');
const { enrichProduct } = require('./queries');

async function addProduct(data) {
  const slug = data.slug || data.name_ar.replace(/\s+/g, '-').toLowerCase();

  // Try with video_url first (column may not exist on old DB)
  let pid;
  try {
    const { rows } = await query(
      `INSERT INTO products (category_slug, name_ar, slug, featured, image, video_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.category_slug, data.name_ar, slug, data.featured ? 1 : 0, data.image || '', data.video_url || '', data.sort_order || 0]
    );
    pid = rows[0].id;
  } catch (_e) {
    // video_url column missing — retry without it
    const { rows } = await query(
      `INSERT INTO products (category_slug, name_ar, slug, featured, image, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.category_slug, data.name_ar, slug, data.featured ? 1 : 0, data.image || '', data.sort_order || 0]
    );
    pid = rows[0].id;
  }

  if (data.specs && typeof data.specs === 'object') {
    for (const [key, val] of Object.entries(data.specs)) {
      await query('INSERT INTO product_specs (product_id, key_ar, value_ar) VALUES ($1, $2, $3)', [pid, key, val]);
    }
  }

  if (data.features && Array.isArray(data.features)) {
    for (let i = 0; i < data.features.length; i++) {
      await query('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES ($1, $2, $3)', [pid, data.features[i], i]);
    }
  }
  if (data.description) {
    await query('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES ($1, $2, $3)', [pid, data.description, 999]);
  }

  return pid;
}

async function updateProduct(id, data) {
  const { rows: existing } = await query('SELECT id FROM products WHERE id = $1', [id]);
  if (existing.length === 0) return null;

  // Try with video_url first; fall back without it if column doesn't exist yet
  try {
    await query(
      `UPDATE products SET category_slug = $1, name_ar = $2, featured = $3, image = $4, video_url = $5, sort_order = $6 WHERE id = $7`,
      [data.category_slug, data.name_ar, data.featured ? 1 : 0, data.image || '', data.video_url || '', data.sort_order || 0, id]
    );
  } catch (_e) {
    await query(
      `UPDATE products SET category_slug = $1, name_ar = $2, featured = $3, image = $4, sort_order = $5 WHERE id = $6`,
      [data.category_slug, data.name_ar, data.featured ? 1 : 0, data.image || '', data.sort_order || 0, id]
    );
  }

  if (data.specs && typeof data.specs === 'object') {
    await query('DELETE FROM product_specs WHERE product_id = $1', [id]);
    for (const [key, val] of Object.entries(data.specs)) {
      await query('INSERT INTO product_specs (product_id, key_ar, value_ar) VALUES ($1, $2, $3)', [id, key, val]);
    }
  }

  if (data.features && Array.isArray(data.features)) {
    await query('DELETE FROM product_features WHERE product_id = $1', [id]);
    for (let i = 0; i < data.features.length; i++) {
      await query('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES ($1, $2, $3)', [id, data.features[i], i]);
    }
  }
  if (data.description) {
    await query('INSERT INTO product_features (product_id, feature_ar, sort_order) VALUES ($1, $2, $3)', [id, data.description, 999]);
  }

  return id;
}

async function deleteProduct(id) {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
  return rowCount > 0;
}

async function getProductById(id) {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p WHERE p.id = $1
  `, [id]);
  if (rows.length === 0) return null;
  return await enrichProduct(rows[0]);
}

module.exports = { addProduct, updateProduct, deleteProduct, getProductById };
