import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

export default function ProductAdd() {
  const navigate = useNavigate()
  const { api } = useAuth()
  const showToast = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [specsText, setSpecsText] = useState('')
  const [saving, setSaving] = useState(false)

  function parseSpecs(text) {
    const specs = {}
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':')
      if (idx > 0) {
        const key = line.slice(0, idx).trim()
        const val = line.slice(idx + 1).trim()
        if (key && val) specs[key] = val
      }
    })
    return specs
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !category) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return
    }
    setSaving(true)

    const body = {
      name_ar: name,
      category_slug: category,
      slug: name.replace(/\s+/g, '-'),
      featured: false,
      sort_order: 99,
    }

    const specs = parseSpecs(specsText)
    if (Object.keys(specs).length > 0) body.specs = specs
    if (description.trim()) body.description = description.trim()

    api('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => {
      if (!r.ok) throw new Error()
      return r.json()
    }).then(() => {
      showToast('✅ تم إضافة المنتج بنجاح')
      setName(''); setCategory(''); setDescription(''); setSpecsText('')
      setSaving(false)
    }).catch(() => {
      showToast('فشل الإضافة', 'error')
      setSaving(false)
    })
  }

  return (
    <>
      <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600,marginBottom:24}}>إضافة منتج جديد</h2>

      <form onSubmit={handleSubmit} style={{maxWidth:700}}>
        <section className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>معلومات أساسية</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>اسم المنتج <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="مثال: ماتور ديمى ١ حصان" required value={name}
                  onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>الفئة <span className="required">*</span></label>
                <select className="form-select" required value={category}
                  onChange={e => setCategory(e.target.value)}>
                  <option value="">اختر الفئة…</option>
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
              <label>المواصفات — كل سطر بformat: <code>المواصفة: القيمة</code></label>
              <textarea className="form-textarea" style={{minHeight:100}}
                placeholder={'القوة: ١ حصان\nالدفع: حتى ٥٤ متر\nالملف: نحاس ١٠٠٪\nالضمان: ١٢ شهر'}
                value={specsText} onChange={e => setSpecsText(e.target.value)} />
            </div>
            <div className="form-group" style={{marginTop:12}}>
              <label>وصف المنتج</label>
              <textarea className="form-textarea" rows={2}
                placeholder="مواصفات إضافية، مميزات..."
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </section>

        <div className="card" style={{marginBottom:20}}>
          <div className="card-body">
            <div className="form-actions" style={{border:'none',margin:0,padding:0,display:'flex',justifyContent:'flex-end',gap:12}}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'جاري الحفظ…' : 'حفظ المنتج'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
