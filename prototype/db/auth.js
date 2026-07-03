const { query } = require('./pool');
const bcrypt = require('bcryptjs');

async function authenticate(username, password) {
  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  if (rows.length === 0) return null;
  const user = rows[0];
  if (!bcrypt.compareSync(password, user.password)) return null;
  const { password: _, security_answer, ...safe } = user;
  return safe;
}

async function getUserByUsername(username) {
  const { rows } = await query(
    'SELECT id, username, name, role, security_question AS "securityQuestion" FROM users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
}

async function verifySecurityAnswer(username, answer) {
  const { rows } = await query('SELECT security_answer FROM users WHERE username = $1', [username]);
  if (rows.length === 0) return false;
  return rows[0].security_answer.toLowerCase() === answer.toLowerCase().trim();
}

async function resetPassword(username, newPassword) {
  if (newPassword.length < 4) return false;
  const hashed = bcrypt.hashSync(newPassword, 10);
  const { rowCount } = await query('UPDATE users SET password = $1 WHERE username = $2', [hashed, username]);
  return rowCount > 0;
}

async function isAdmin(username) {
  const { rows } = await query('SELECT role FROM users WHERE username = $1', [username]);
  return rows[0]?.role === 'مدير';
}

async function getAllUsers(requesterUsername) {
  if (!(await isAdmin(requesterUsername))) return [];
  const { rows } = await query('SELECT id, username, name, role FROM users ORDER BY id');
  return rows;
}

async function createUser(data, requesterUsername) {
  if (!(await isAdmin(requesterUsername))) return { ok: false, error: 'غير مصرح لك بإضافة مستخدمين' };
  const { rows: existing } = await query('SELECT id FROM users WHERE username = $1', [data.username]);
  if (existing.length > 0) return { ok: false, error: 'اسم المستخدم موجود بالفعل' };
  if (data.password.length < 4) return { ok: false, error: 'كلمة المرور قصيرة جداً' };
  const hashedPw = bcrypt.hashSync(data.password, 10);
  const { rows } = await query(
    `INSERT INTO users (username, password, name, role, security_question, security_answer)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, name, role`,
    [data.username, hashedPw, data.name, data.role || 'موظف', data.securityQuestion || 'ما هو اسم والدتك؟', data.securityAnswer || 'جواب']
  );
  return { ok: true, user: rows[0] };
}

async function deleteUser(id, requesterUsername) {
  if (!(await isAdmin(requesterUsername))) return { ok: false, error: 'غير مصرح' };
  const { rows: target } = await query('SELECT role FROM users WHERE id = $1', [id]);
  if (target.length === 0) return { ok: false, error: 'المستخدم غير موجود' };
  if (target[0].role === 'مدير') {
    const { rows: adminCount } = await query("SELECT COUNT(*)::int as c FROM users WHERE role = 'مدير'");
    if (adminCount[0].c <= 1) return { ok: false, error: 'لا يمكن حذف المدير الوحيد' };
  }
  await query('DELETE FROM users WHERE id = $1', [id]);
  return { ok: true };
}

module.exports = { authenticate, getUserByUsername, verifySecurityAnswer, resetPassword, isAdmin, getAllUsers, createUser, deleteUser };
