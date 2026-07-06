const { query } = require('./pool');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

async function authenticate(username, password) {
  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  if (rows.length === 0) return null;
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;
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
  return bcrypt.compare(answer.toLowerCase().trim(), rows[0].security_answer);
}

async function resetPassword(username, newPassword) {
  if (newPassword.length < MIN_PASSWORD_LENGTH) return false;
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
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
  if (data.password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `كلمة المرور قصيرة جداً (يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل)` };
  const [hashedPw, hashedAnswer] = await Promise.all([
    bcrypt.hash(data.password, SALT_ROUNDS),
    data.securityAnswer ? bcrypt.hash(data.securityAnswer.toLowerCase().trim(), SALT_ROUNDS) : null,
  ]);
  const { rows } = await query(
    `INSERT INTO users (username, password, name, role, security_question, security_answer)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, name, role`,
    [data.username, hashedPw, data.name, data.role || 'موظف', data.securityQuestion || 'ما هو اسم والدتك؟', hashedAnswer || bcrypt.hashSync('جواب', SALT_ROUNDS)]
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
