import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

export default function ProductEdit() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { api } = useAuth()
  const showToast = useToast()
  const [form, setForm] = useState({ name_ar: '', category_slug: '', specs_text: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [productId, setProductId] = useState(null)

  useEffect(() => {
    api(`/api/products/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p) {
          setProductId(p.id)
          const specsLines = p.specs ? Object.entries(p.specs).map(([k, v]) => k + ': ' + v).join('\n') : ''
          const desc = p.features?.join('\n') || ''
          setForm({ name_ar: p.name, category_slug: p.category, specs_text: specsLines, description: desc })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  function parseSpecs(text) {
    const specs = {}
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':')
      if (idx > 0) { const k = line.slice(0, idx).trim(); const v = line.slice(idx + 1).trim(); if (k && v) specs[k] = v }
    })
    return specs
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name_ar || !form.category_slug) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return
    }
    setSaving(true)

    const body = {
      name_ar: form.name_ar,
      category_slug: form.category_slug,
      slug: form.name_ar.replace(/\s+/g, '-'),
    }

    const specs = parseSpecs(form.specs_text)
    if (Object.keys(specs).length > 0) body.specs = specs
    if (form.description.trim()) body.description = form.description.trim()

    api(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => {
      if (r.ok) showToast('✅ تم تحديث المنتج بنجاح')
      else showToast('فشل التحديث', 'error')
      setSaving(false)
    }).catch(() => { showToast('فشل التحديث', 'error'); setSaving(false) })
  }

  if (loading) {
    return <div className="empty-state"><div className="empty-icon">⏳</div><h3>جاري التحميل…</h3></div>
  }

  return (
    <>
      <div style={{marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600}}>تعديل المنتج</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>← العودة</button>
      </div>

      <form onSubmit={handleSubmit} style={{maxWidth:700}}>
        <section className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>معلومات المنتج</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name_ar">اسم المنتج <span className="required">*</span></label>
                <input type="text" id="name_ar" className="form-input" required value={form.name_ar}
                  onChange={e => setForm(p => ({...p, name_ar: e.target.value}))} />
              </div>
              <div className="form-group">
                <label htmlFor="category_slug">الفئة <span className="required">*</span></label>
                <select id="category_slug" className="form-select" required value={form.category_slug}
                  onChange={e => setForm(p => ({...p, category_slug: e.target.value}))}>
                  <option value="motor">مواتير مياه</option>
                  <option value="submersible">غواطس</option>
                  <option value="flomax">فلوماك</option>
                  <option value="spare">قطع غيار</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>المواصفات (للمقارنة)</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label>كل سطر بformat: <code>المواصفة: القيمة</code></label>
              <textarea className="form-textarea" style={{minHeight:100}}
                placeholder={'القوة: ١ حصان\nالدفع: حتى ٥٤ متر'}
                value={form.specs_text}
                onChange={e => setForm(p => ({...p, specs_text: e.target.value}))} />
            </div>
            <div className="form-group" style={{marginTop:12}}>
              <label>الوصف</label>
              <textarea className="form-textarea" rows={2}
                value={form.description}
                onChange={e => setForm(p => ({...p, description: e.target.value}))} />
            </div>
          </div>
        </section>

        <div className="card" style={{marginBottom:20}}>
          <div className="card-body">
            <div className="form-actions" style={{border:'none',margin:0,padding:0,display:'flex',justifyContent:'flex-end',gap:12}}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'جاري الحفظ…' : 'تحديث المنتج'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
