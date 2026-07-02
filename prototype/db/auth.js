const { getDb } = require('./init');
const bcrypt = require('bcryptjs');

function authenticate(username, password) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) return null;
  const { password: _, security_answer: __, ...safe } = user;
  return safe;
}

function getUserByUsername(username) {
  const db = getDb();
  const user = db.prepare('SELECT id, username, name, role, security_question AS securityQuestion FROM users WHERE username = ?').get(username);
  return user || null;
}

function verifySecurityAnswer(username, answer) {
  const db = getDb();
  const user = db.prepare('SELECT security_answer FROM users WHERE username = ?').get(username);
  if (!user) return false;
  return user.security_answer.toLowerCase() === answer.toLowerCase().trim();
}

function resetPassword(username, newPassword) {
  if (newPassword.length < 4) return false;
  const db = getDb();
  const hashed = bcrypt.hashSync(newPassword, 10);
  const r = db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashed, username);
  return r.changes > 0;
}

function isAdmin(username) {
  const db = getDb();
  const user = db.prepare('SELECT role FROM users WHERE username = ?').get(username);
  return user?.role === 'مدير';
}

function getAllUsers(requesterUsername) {
  if (!isAdmin(requesterUsername)) return [];
  const db = getDb();
  return db.prepare('SELECT id, username, name, role FROM users ORDER BY id').all();
}

function createUser(data, requesterUsername) {
  if (!isAdmin(requesterUsername)) return { ok: false, error: 'غير مصرح لك بإضافة مستخدمين' };
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(data.username);
  if (existing) return { ok: false, error: 'اسم المستخدم موجود بالفعل' };
  if (data.password.length < 4) return { ok: false, error: 'كلمة المرور قصيرة جداً' };
  const hashedPw = bcrypt.hashSync(data.password, 10);
  const info = db.prepare(
    'INSERT INTO users (username, password, name, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.username, hashedPw, data.name, data.role || 'موظف', data.securityQuestion || 'ما هو اسم والدتك؟', data.securityAnswer || 'جواب');
  return { ok: true, user: { id: info.lastInsertRowid, username: data.username, name: data.name, role: data.role } };
}

function deleteUser(id, requesterUsername) {
  if (!isAdmin(requesterUsername)) return { ok: false, error: 'غير مصرح' };
  const db = getDb();
  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
  if (!target) return { ok: false, error: 'المستخدم غير موجود' };
  if (target.role === 'مدير') {
    const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('مدير');
    if (adminCount.c <= 1) return { ok: false, error: 'لا يمكن حذف المدير الوحيد' };
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return { ok: true };
}

module.exports = { authenticate, getUserByUsername, verifySecurityAnswer, resetPassword, isAdmin, getAllUsers, createUser, deleteUser };
