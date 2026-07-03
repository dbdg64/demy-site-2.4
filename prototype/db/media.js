const { query } = require('./pool');

async function getAllMedia(section) {
  if (section) {
    const { rows } = await query('SELECT * FROM media WHERE section = $1 ORDER BY sort_order', [section]);
    return rows;
  }
  const { rows } = await query('SELECT * FROM media ORDER BY sort_order');
  return rows;
}

async function getMediaById(id) {
  const { rows } = await query('SELECT * FROM media WHERE id = $1', [id]);
  return rows[0] || null;
}

async function addMedia(data) {
  const { rows } = await query(
    `INSERT INTO media (title, description, type, file_path, section, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [data.title, data.description || '', data.type || 'image', data.file_path, data.section || 'awareness', data.sort_order || 0]
  );
  return rows[0].id;
}

async function updateMedia(id, data) {
  await query(
    `UPDATE media SET title = $1, description = $2, type = $3, file_path = $4, section = $5, sort_order = $6 WHERE id = $7`,
    [data.title, data.description || '', data.type || 'image', data.file_path, data.section || 'awareness', data.sort_order || 0, id]
  );
  return id;
}

async function deleteMedia(id) {
  const { rowCount } = await query('DELETE FROM media WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { getAllMedia, getMediaById, addMedia, updateMedia, deleteMedia };
