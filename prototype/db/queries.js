const { query } = require('./pool');

async function enrichProducts(rows) {
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);

  // Batch load all specs, features, images in 3 total queries
  const [specsRes, featuresRes, extrasRes] = await Promise.all([
    query('SELECT product_id, key_ar, value_ar FROM product_specs WHERE product_id = ANY($1)', [ids]),
    query('SELECT product_id, feature_ar FROM product_features WHERE product_id = ANY($1) ORDER BY sort_order', [ids]),
    query('SELECT product_id, path FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order', [ids]),
  ]);

  // Index by product_id
  const specsMap = {};
  for (const s of specsRes.rows) {
    if (!specsMap[s.product_id]) specsMap[s.product_id] = {};
    specsMap[s.product_id][s.key_ar] = s.value_ar;
  }

  const featuresMap = {};
  for (const f of featuresRes.rows) {
    if (!featuresMap[f.product_id]) featuresMap[f.product_id] = [];
    featuresMap[f.product_id].push(f.feature_ar);
  }

  const extrasMap = {};
  for (const e of extrasRes.rows) {
    if (!extrasMap[e.product_id]) extrasMap[e.product_id] = [];
    extrasMap[e.product_id].push(e.path.replace(/^\.\.\//, '/'));
  }

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    featured: row.featured === 1 || row.featured === true,
    image: row.image ? row.image.replace(/^\.\.\//, '/') : '',
    video_url: row.video_url || '',
    slug: row.slug,
    specs: specsMap[row.id] || {},
    features: featuresMap[row.id] || null,
    extras: extrasMap[row.id] || null,
  }));
}

async function getAllProducts() {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.video_url, p.slug
    FROM products p
    ORDER BY p.sort_order
  `);
  return enrichProducts(rows);
}

async function getProductsByCategory(categorySlug) {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.video_url, p.slug
    FROM products p
    WHERE p.category_slug = $1
    ORDER BY p.sort_order
  `, [categorySlug]);
  return enrichProducts(rows);
}

async function getFeaturedProducts() {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.video_url, p.slug
    FROM products p
    WHERE p.featured = 1
    ORDER BY p.sort_order
  `);
  return enrichProducts(rows);
}

async function getProductBySlug(slug) {
  const { rows } = await query(`
    SELECT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.video_url, p.slug
    FROM products p
    WHERE p.slug = $1
  `, [slug]);
  if (rows.length === 0) return null;
  const enriched = await enrichProducts(rows);
  return enriched[0];
}

async function searchProducts(searchQuery) {
  const like = '%' + searchQuery + '%';
  const { rows } = await query(`
    SELECT DISTINCT p.id, p.name_ar AS name, p.category_slug AS category, p.featured, p.image, p.video_url, p.slug
    FROM products p
    LEFT JOIN product_specs ps ON ps.product_id = p.id
    LEFT JOIN product_features pf ON pf.product_id = p.id
    WHERE p.name_ar ILIKE $1
       OR ps.value_ar ILIKE $1
       OR pf.feature_ar ILIKE $1
    ORDER BY p.sort_order
  `, [like]);
  return enrichProducts(rows);
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

module.exports = {
  getAllProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getProductBySlug,
  searchProducts,
  getCategories,
  getCategoryBySlug,
};
