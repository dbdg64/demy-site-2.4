import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { api } = useAuth()
  const showToast = useToast()
  const [total, setTotal] = useState(0)
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api('/api/products?featured=1')
      .then(r => r.json()).then(setFeatured).catch(() => showToast('فشل الاتصال بالخادم', 'error'))
    api('/api/products')
      .then(r => r.json()).then(d => setTotal(d.length)).catch(() => showToast('فشل الاتصال بالخادم', 'error'))
  }, [])

  function navTo(path) {
    navigate(path)
  }

  return (
    <>
      <section style={{marginBottom:40}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:700,marginBottom:8}}>نظام إدارة المنتجات</h1>
        <p style={{color:'var(--muted)',fontSize:15,maxWidth:500}}>لوحة تحكم متكاملة لإدارة منتجات مواتير المياه — إضافة، تعديل، بحث، وعرض تفاصيل المنتجات.</p>
      </section>

      <section className="stats-grid" data-od-id="stats-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'var(--accent-soft)',color:'var(--accent)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">إجمالي المنتجات</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'color-mix(in oklch,var(--success) 12%,transparent)',color:'var(--success)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="stat-value">{featured.length}</div>
          <div className="stat-label">مميز</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'color-mix(in oklch,var(--warning) 12%,transparent)',color:'var(--warning-text)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="stat-value">{featured.filter(p => p.featured).length || '—'}</div>
          <div className="stat-label">في المخزون</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'color-mix(in oklch,var(--muted) 12%,transparent)',color:'var(--muted)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="stat-value">{featured.length > 0 ? 4 : '—'}</div>
          <div className="stat-label">فئات</div>
        </div>
      </section>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}} data-od-id="dashboard-grid">
        <section className="card" data-od-id="recent-activity">
          <div className="card-header"><h3>منتجات مميزة</h3></div>
          <div className="card-body" style={{padding:'8px 20px'}}>
            <table className="dsh-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الفئة</th>
                  <th>حالة</th>
                </tr>
              </thead>
              <tbody>
                {featured.length === 0 ? (
                  <tr><td colSpan={3} style={{textAlign:'center',color:'var(--muted)',padding:20}}>لا توجد منتجات مميزة</td></tr>
                ) : featured.map((p, i) => (
                  <tr key={p.id || i}>
                    <td>
                      <div className="prod-info">
                        <div className="prod-thumb" style={{background:'var(--accent-soft)'}}>{p.name.charAt(0)}</div>
                        <div><div className="prod-name">{p.name}</div></div>
                      </div>
                    </td>
                    <td><span className="prod-category">{p.category}</span></td>
                    <td>{p.featured ? '⭐' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card" data-od-id="quick-links">
          <div className="card-header"><h3>إجراءات سريعة</h3></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:12}}>
            <button className="btn btn-primary" onClick={() => navTo('/products/add')} style={{justifyContent:'center'}}>
              ➕ إضافة منتج جديد
            </button>
            <button className="btn btn-secondary" onClick={() => navTo('/products')} style={{justifyContent:'center'}}>
              📋 إدارة المنتجات
            </button>
            <button className="btn btn-secondary" onClick={() => navTo('/dashboard')} style={{justifyContent:'center'}}>
              🔄 تحديث البيانات
            </button>
          </div>
        </section>
      </div>

    </>
  )
}
