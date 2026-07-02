const { getDb } = require('./init');

function getAllMedia(section) {
  const db = getDb();
  if (section) {
    return db.prepare('SELECT * FROM media WHERE section = ? ORDER BY sort_order').all(section);
  }
  return db.prepare('SELECT * FROM media ORDER BY sort_order').all();
}

function getMediaById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM media WHERE id = ?').get(id);
}

function addMedia(data) {
  const db = getDb();
  const info = db.prepare(
    'INSERT INTO media (title, description, type, file_path, section, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.title, data.description || '', data.type || 'image', data.file_path, data.section || 'awareness', data.sort_order || 0);
  return info.lastInsertRowid;
}

function updateMedia(id, data) {
  const db = getDb();
  db.prepare(
    'UPDATE media SET title = ?, description = ?, type = ?, file_path = ?, section = ?, sort_order = ? WHERE id = ?'
  ).run(data.title, data.description || '', data.type || 'image', data.file_path, data.section || 'awareness', data.sort_order || 0, id);
  return id;
}

function deleteMedia(id) {
  const db = getDb();
  const r = db.prepare('DELETE FROM media WHERE id = ?').run(id);
  return r.changes > 0;
}

module.exports = { getAllMedia, getMediaById, addMedia, updateMedia, deleteMedia };
