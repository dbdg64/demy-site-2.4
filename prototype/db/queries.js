const { getDb } = require('./init');

function getAllProducts() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    ORDER BY p.sort_order
  `).all();

  return rows.map(row => enrichProduct(row));
}

function getProductsByCategory(categorySlug) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    WHERE p.category_slug = ?
    ORDER BY p.sort_order
  `).all(categorySlug);

  return rows.map(row => enrichProduct(row));
}

function getFeaturedProducts() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    WHERE p.featured = 1
    ORDER BY p.sort_order
  `).all();

  return rows.map(row => enrichProduct(row));
}

function getProductBySlug(slug) {
  const db = getDb();
  const row = db.prepare(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    WHERE p.slug = ?
  `).get(slug);

  return row ? enrichProduct(row) : null;
}

function searchProducts(query) {
  const db = getDb();
  const like = '%' + query + '%';
  const rows = db.prepare(`
    SELECT DISTINCT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    LEFT JOIN product_specs ps ON ps.product_id = p.id
    LEFT JOIN product_features pf ON pf.product_id = p.id
    WHERE p.name_ar LIKE ?
       OR ps.value_ar LIKE ?
       OR pf.feature_ar LIKE ?
    ORDER BY p.sort_order
  `).all(like, like, like);

  return rows.map(row => enrichProduct(row));
}

function getCategories() {
  const db = getDb();
  return db.prepare(`
    SELECT c.slug, c.name_ar AS name_ar, c.description_ar AS description_ar, c.icon,
           (SELECT COUNT(*) FROM products WHERE category_slug = c.slug) AS product_count
    FROM categories c
    ORDER BY c.sort_order
  `).all();
}

function getCategoryBySlug(slug) {
  const db = getDb();
  return db.prepare(`
    SELECT c.slug, c.name_ar AS name_ar, c.description_ar AS description_ar, c.icon,
           (SELECT COUNT(*) FROM products WHERE category_slug = c.slug) AS product_count
    FROM categories c
    WHERE c.slug = ?
  `).get(slug);
}

function enrichProduct(row) {
  const db = getDb();
  const specs = db.prepare('SELECT key_ar, value_ar FROM product_specs WHERE product_id = ?').all(row.id);
  const features = db.prepare('SELECT feature_ar FROM product_features WHERE product_id = ? ORDER BY sort_order').all(row.id);
  const extras = db.prepare('SELECT path FROM product_images WHERE product_id = ? ORDER BY sort_order').all(row.id);

  const specsObj = {};
  for (const s of specs) specsObj[s.key_ar] = s.value_ar;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    featured: row.featured === 1,
    image: row.image ? row.image.replace(/^\.\.\//, '/') : '',
    slug: row.slug,
    specs: specsObj,
    features: features.length > 0 ? features.map(f => f.feature_ar) : null,
    extras: extras.length > 0 ? extras.map(e => e.path.replace(/^\.\.\//, '/')) : null,
  };
}

module.exports = {
  getAllProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getProductBySlug,
  searchProducts,
  getCategories,
  getCategoryBySlug,
  enrichProduct,
};
