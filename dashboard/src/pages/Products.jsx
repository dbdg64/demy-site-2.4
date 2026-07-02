import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

export default function Products() {
  const navigate = useNavigate()
  const { api } = useAuth()
  const showToast = useToast()
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    api('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setFiltered(data) })
      .catch(() => showToast('فشل الاتصال بالخادم', 'error'))
  }, [])

  useEffect(() => {
    let list = [...products]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p => p.name.includes(q) || (p.slug || '').includes(q) || p.category.includes(q))
    }
    if (category !== 'all') list = list.filter(p => p.category === category)
    setFiltered(list)
  }, [query, category, products])

  function handleDelete() {
    if (!deleteTarget) return
    const p = products.find(x => x.id === deleteTarget)
    api(`/api/products/${deleteTarget}`, { method: 'DELETE' })
      .then(r => {
        if (r.ok) {
          showToast(`تم حذف "${p?.name}" بنجاح`, 'success')
          setDeleteTarget(null)
          return api('/api/products').then(r => r.json())
        }
      })
      .then(data => { if (data) { setProducts(data); setFiltered(data) } })
      .catch(() => showToast('فشل الاتصال بالخادم', 'error'))
  }

  return (
    <>
      <div className="row-between" style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600}}>المنتجات</h2>
        <a href="/products/add" className="btn btn-primary" onClick={e => { e.preventDefault(); navigate('/products/add') }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة منتج جديد
        </a>
      </div>

      <section className="card" style={{marginBottom:20}}>
        <div className="card-body">
          <div className="filter-bar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="بحث بالاسم أو الكود..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="all">جميع الفئات</option>
              <option value="motor">مواتير</option>
              <option value="submersible">غواطس</option>
              <option value="flomax">فلوماك</option>
              <option value="spare">قطع غيار</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>قائمة المنتجات</h3>
          <span style={{fontSize:13,color:'var(--muted)'}}>عرض {filtered.length} من {products.length} منتج</span>
        </div>
        <div className="card-body" style={{padding:0}}>
          <div className="table-wrap">
            <table className="dsh-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الفئة</th>
                  <th>مميز</th>
                  <th style={{width:120}}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon">📦</div><h3>لا توجد منتجات</h3><p>لا يوجد منتجات تطابق البحث.</p></div></td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="prod-info">
                        <div className="prod-thumb" style={{background:'var(--accent-soft)'}}>{p.name.charAt(0)}</div>
                        <div>
                          <div className="prod-name">{p.name}</div>
                          <div className="prod-sku">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="prod-category">{p.category}</span></td>
                    <td>{p.featured ? '⭐' : '—'}</td>
                    <td>
                      <div className="row-actions" style={{display:'flex',alignItems:'center',gap:4}}>
                        <a href={`/products/${p.slug}`} className="btn btn-ghost btn-sm btn-icon" title="عرض التفاصيل"
                          onClick={e => { e.preventDefault(); navigate(`/products/${p.slug}`) }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </a>
                        <a href={`/products/edit/${p.slug}`} className="btn btn-ghost btn-sm btn-icon" title="تعديل"
                          onClick={e => { e.preventDefault(); navigate(`/products/edit/${p.slug}`) }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </a>
                        <button className="btn btn-ghost btn-sm btn-icon" title="حذف" onClick={() => setDeleteTarget(p.id)} style={{color:'var(--danger)'}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
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
            <p>هل أنت متأكد من حذف "{products.find(p => p.id === deleteTarget)?.name}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete}>نعم، حذف</button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
