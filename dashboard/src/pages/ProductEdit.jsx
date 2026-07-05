import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

async function uploadFile(api, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await api('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('upload failed')
  return res.json()
}

export default function ProductEdit() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { api } = useAuth()
  const showToast = useToast()
  const [form, setForm] = useState({ name_ar: '', category_slug: '', specs_text: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [productId, setProductId] = useState(null)

  /* ── Media state ── */
  const [mainImage, setMainImage] = useState(null)
  const [mainPreview, setMainPreview] = useState('')
  const [currentMain, setCurrentMain] = useState('')
  const [extras, setExtras] = useState([])
  const [newExtraFiles, setNewExtraFiles] = useState([])
  const [newExtraPreviews, setNewExtraPreviews] = useState([])
  const [video, setVideo] = useState(null)
  const [currentVideo, setCurrentVideo] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api(`/api/products/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p) {
          setProductId(p.id)
          setCurrentMain(p.image || '')
          setExtras(p.extras || [])
          setCurrentVideo(p.video_url || '')
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

  /* ── Media handlers ── */
  function onMainImage(e) {
    const f = e.target.files[0]
    if (!f) return
    setMainImage(f)
    setMainPreview(URL.createObjectURL(f))
  }

  function onNewExtra(e) {
    const files = Array.from(e.target.files)
    setNewExtraFiles(prev => [...prev, ...files])
    setNewExtraPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function removeNewExtra(i) {
    setNewExtraFiles(prev => prev.filter((_, idx) => idx !== i))
    setNewExtraPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function removeExistingExtra(imgPath, e) {
    e.preventDefault()
    if (!confirm('حذف هذه الصورة؟')) return
    // Find the image id — we need the product_id too
    // We store the index to delete
    try {
      // Get all product images and find the right one
      const res = await api(`/api/products/${productId}/images`, { method: 'GET' })
      // We only have POST/DELETE endpoints. Let's find by path.
      // Actually, let's just reload the page after deletion via the API
      // For now, do a DELETE to a specific endpoint — we need imgId
      showToast('جاري حذف الصورة…', 'info')
      // We'll use the index-based approach: the server needs to know which image to delete
      // Since we don't have imgId, let's use a different approach: delete from extras by path
    } catch (err) {
      showToast('فشل حذف الصورة', 'error')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name_ar || !form.category_slug) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return
    }
    setSaving(true)
    setUploading(true)

    try {
      let mainUrl = currentMain
      let videoUrl = currentVideo

      /* Upload new main image */
      if (mainImage) {
        const d = await uploadFile(api, mainImage)
        mainUrl = d.url
      }

      /* Upload new video */
      if (video) {
        const d = await uploadFile(api, video)
        videoUrl = d.url
      }

      /* Upload new extra images */
      for (const f of newExtraFiles) {
        const d = await uploadFile(api, f)
        await api(`/api/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: d.url }),
        })
      }

      setUploading(false)

      /* Update product */
      const body = {
        name_ar: form.name_ar,
        category_slug: form.category_slug,
        image: mainUrl,
        video_url: videoUrl,
      }
      const specs = parseSpecs(form.specs_text)
      if (Object.keys(specs).length > 0) body.specs = specs
      if (form.description.trim()) body.description = form.description.trim()

      const r = await api(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        showToast('✅ تم تحديث المنتج بنجاح')
        navigate('/products')
      } else {
        showToast('فشل التحديث', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('فشل التحديث', 'error')
    }
    setSaving(false)
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

        {/* ── Media section ── */}
        <section className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>الصور والفيديو</h3></div>
          <div className="card-body">
            {/* Current main image */}
            {currentMain && (
              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>الصورة الحالية</label>
                <img src={currentMain} alt="current main" style={{width:160,height:120,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)'}} />
              </div>
            )}
            <div className="form-group">
              <label>تغيير الصورة الرئيسية</label>
              <input type="file" accept="image/*" onChange={onMainImage} />
              {mainPreview && (
                <div style={{marginTop:8}}>
                  <img src={mainPreview} alt="new main" style={{width:160,height:120,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)'}} />
                </div>
              )}
            </div>

            {/* Current video */}
            {currentVideo && (
              <div style={{margin:'16px 0'}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>الفيديو الحالي</label>
                <video src={currentVideo} style={{width:240,maxHeight:140,borderRadius:6}} controls />
              </div>
            )}
            <div className="form-group">
              <label>تغيير الفيديو</label>
              <input type="file" accept="video/*" onChange={e => setVideo(e.target.files[0])} />
              {video && <p style={{marginTop:4,fontSize:12,color:'var(--text-secondary)'}}>✅ {video.name}</p>}
            </div>

            {/* Extra images */}
            <div style={{marginTop:16}}>
              <label style={{display:'block',marginBottom:8,fontSize:13,fontWeight:600}}>الصور الإضافية الحالية ({extras.length})</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {extras.map((url, i) => (
                  <div key={i} style={{position:'relative'}}>
                    <img src={url} alt={`extra ${i}`} style={{width:80,height:64,objectFit:'cover',borderRadius:4,border:'1px solid var(--border)'}} />
                  </div>
                ))}
                {extras.length === 0 && <p style={{fontSize:12,color:'var(--text-muted)'}}>لا توجد صور إضافية</p>}
              </div>
            </div>

            <div className="form-group" style={{marginTop:12}}>
              <label>إضافة صور إضافية جديدة</label>
              <input type="file" accept="image/*" multiple onChange={onNewExtra} />
              {newExtraPreviews.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                  {newExtraPreviews.map((url, i) => (
                    <div key={i} style={{position:'relative'}}>
                      <img src={url} alt={`new ${i}`} style={{width:80,height:64,objectFit:'cover',borderRadius:4,border:'1px solid var(--border)'}} />
                      <button type="button" onClick={() => removeNewExtra(i)}
                        style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',border:'none',background:'#ef4444',color:'#fff',fontSize:12,cursor:'pointer',lineHeight:'20px',textAlign:'center',padding:0}}>×</button>
                    </div>
                  ))}
                </div>
              )}
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
              <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                {uploading ? 'جاري رفع الملفات…' : saving ? 'جاري الحفظ…' : 'تحديث المنتج'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
