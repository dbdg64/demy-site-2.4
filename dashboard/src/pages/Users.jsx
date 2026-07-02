import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

export default function Users() {
  const { user, api } = useAuth()
  const showToast = useToast()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'موظف', securityQuestion: '', securityAnswer: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  function fetchUsers() {
    api('/api/users')
      .then(r => r.json()).then(setUsers).catch(() => showToast('فشل الاتصال بالخادم', 'error'))
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!form.username || !form.password || !form.name) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return
    }
    api('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(r => r.json().then(d => ({ ok: r.ok, ...d })))
      .then(d => {
        if (!d.ok) { showToast(d.error || 'فشل', 'error'); return }
        showToast(`✅ تم إضافة "${d.name}" بنجاح`, 'success')
        setForm({ username: '', password: '', name: '', role: 'موظف', securityQuestion: '', securityAnswer: '' })
        setShowForm(false)
        fetchUsers()
      })
  }

  function handleDelete(id) {
    api(`/api/users/${id}`, {
      method: 'DELETE'
    }).then(r => r.json().then(d => ({ ok: r.ok, ...d })))
      .then(d => {
        if (!d.ok) { showToast(d.error || 'فشل', 'error'); return }
        showToast('✅ تم حذف المستخدم', 'success')
        setDeleteTarget(null)
        fetchUsers()
      })
  }

  if (user?.role !== 'مدير') {
    return <div className="empty-state"><div className="empty-icon">🔒</div><h3>غير مصرح</h3><p>هذه الصفحة متاحة فقط للمدير.</p></div>
  }

  return (
    <>
      <div className="row-between" style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600}}>إدارة المستخدمين</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '➕ إضافة مستخدم'}
        </button>
      </div>

      {showForm && (
        <section className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>إضافة مستخدم جديد</h3></div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>اسم المستخدم <span className="required">*</span></label>
                  <input type="text" className="form-input" placeholder="username"
                         value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>كلمة المرور <span className="required">*</span></label>
                  <input type="password" className="form-input" placeholder="••••••"
                         value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>الاسم <span className="required">*</span></label>
                  <input type="text" className="form-input" placeholder="مثال: محمد علي"
                         value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>الصلاحية</label>
                  <select className="form-select" value={form.role}
                          onChange={e => setForm(p => ({...p, role: e.target.value}))}>
                    <option value="موظف">موظف</option>
                    <option value="مدير">مدير</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>سؤال الأمان</label>
                  <input type="text" className="form-input" placeholder="ما هو اسم والدتك؟"
                         value={form.securityQuestion} onChange={e => setForm(p => ({...p, securityQuestion: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>إجابة سؤال الأمان</label>
                  <input type="text" className="form-input" placeholder="جواب السؤال"
                         value={form.securityAnswer} onChange={e => setForm(p => ({...p, securityAnswer: e.target.value}))} />
                </div>
              </div>
              <div className="form-actions" style={{border:'none',margin:0,padding:0,display:'flex',justifyContent:'flex-end',gap:12,marginTop:16}}>
                <button type="submit" className="btn btn-primary">حفظ المستخدم</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h3>المستخدمين</h3>
          <span style={{fontSize:13,color:'var(--muted)'}}>{users.length} مستخدم</span>
        </div>
        <div className="card-body" style={{padding:0}}>
          <div className="table-wrap">
            <table className="dsh-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>اسم المستخدم</th>
                  <th>الصلاحية</th>
                  <th style={{width:80}}></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><div className="prod-info"><div className="prod-thumb" style={{background:'var(--accent-soft)',color:'var(--accent)'}}>{u.name.charAt(0)}</div><div className="prod-name">{u.name}</div></div></td>
                    <td><span className="prod-category" style={{fontFamily:'var(--font-mono)'}}>{u.username}</span></td>
                    <td><span className={`status-badge ${u.role === 'مدير' ? 'status-available' : 'status-low-stock'}`}><span className="dot"></span>{u.role}</span></td>
                    <td>
                      {u.username !== user?.username && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="حذف" onClick={() => setDeleteTarget(u.id)} style={{color:'var(--danger)'}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {deleteTarget && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal-box">
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteTarget)}>نعم، حذف</button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
