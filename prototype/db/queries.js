const { query } = require('./pool');

async function getAllProducts() {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    ORDER BY p.sort_order
  `);
  return await Promise.all(rows.map(row => enrichProduct(row)));
}

async function getProductsByCategory(categorySlug) {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    WHERE p.category_slug = $1
    ORDER BY p.sort_order
  `, [categorySlug]);
  return await Promise.all(rows.map(row => enrichProduct(row)));
}

async function getFeaturedProducts() {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    WHERE p.featured = 1
    ORDER BY p.sort_order
  `);
  return await Promise.all(rows.map(row => enrichProduct(row)));
}

async function getProductBySlug(slug) {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    WHERE p.slug = $1
  `, [slug]);
  if (rows.length === 0) return null;
  return await enrichProduct(rows[0]);
}

async function searchProducts(searchQuery) {
  const like = '%' + searchQuery + '%';
  const { rows } = await query(`
    SELECT DISTINCT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.slug
    FROM products p
    LEFT JOIN product_specs ps ON ps.product_id = p.id
    LEFT JOIN product_features pf ON pf.product_id = p.id
    WHERE p.name_ar ILIKE $1
       OR ps.value_ar ILIKE $1
       OR pf.feature_ar ILIKE $1
    ORDER BY p.sort_order
  `, [like]);
  return await Promise.all(rows.map(row => enrichProduct(row)));
}

async function getCategories() {
  const { rows } = await query(`
    SELECT c.slug, c.name_ar, c.description_ar, c.icon,
           (SELECT COUNT(*)::int FROM products WHERE category_slug = c.slug) AS product_count
    FROM categories c
    ORDER BY c.sort_order
  `);
  return rows;
}

async function getCategoryBySlug(slug) {
  const { rows } = await query(`
    SELECT c.slug, c.name_ar, c.description_ar, c.icon,
           (SELECT COUNT(*)::int FROM products WHERE category_slug = c.slug) AS product_count
    FROM categories c
    WHERE c.slug = $1
  `, [slug]);
  return rows[0] || null;
}

async function enrichProduct(row) {
  const [specsRes, featuresRes, extrasRes] = await Promise.all([
    query('SELECT key_ar, value_ar FROM product_specs WHERE product_id = $1', [row.id]),
    query('SELECT feature_ar FROM product_features WHERE product_id = $1 ORDER BY sort_order', [row.id]),
    query('SELECT path FROM product_images WHERE product_id = $1 ORDER BY sort_order', [row.id])
  ]);

  const specsObj = {};
  for (const s of specsRes.rows) specsObj[s.key_ar] = s.value_ar;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    featured: row.featured === 1 || row.featured === true,
    image: row.image ? row.image.replace(/^\.\.\//, '/') : '',
    slug: row.slug,
    specs: specsObj,
    features: featuresRes.rows.length > 0 ? featuresRes.rows.map(f => f.feature_ar) : null,
    extras: extrasRes.rows.length > 0 ? extrasRes.rows.map(e => e.path.replace(/^\.\.\//, '/')) : null,
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
