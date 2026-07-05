import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ToastContext'

async function uploadFile(api, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await api('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('upload failed')
  return res.json()
}

export default function ProductAdd() {
  const navigate = useNavigate()
  const { api } = useAuth()
  const showToast = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [specsText, setSpecsText] = useState('')
  const [saving, setSaving] = useState(false)

  /* ── Media state ── */
  const [mainImage, setMainImage] = useState(null)         // File object
  const [mainPreview, setMainPreview] = useState('')       // data URI
  const [extraImages, setExtraImages] = useState([])       // File[]
  const [extraPreviews, setExtraPreviews] = useState([])   // data URI[]
  const [video, setVideo] = useState(null)                 // File object
  const [uploading, setUploading] = useState(false)

  /* ── File handlers ── */
  function onMainImage(e) {
    const f = e.target.files[0]
    if (!f) return
    setMainImage(f)
    setMainPreview(URL.createObjectURL(f))
  }

  function onExtraImages(e) {
    const files = Array.from(e.target.files)
    setExtraImages(prev => [...prev, ...files])
    const urls = files.map(f => URL.createObjectURL(f))
    setExtraPreviews(prev => [...prev, ...urls])
  }

  function removeExtraImage(idx) {
    setExtraImages(prev => prev.filter((_, i) => i !== idx))
    setExtraPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  function onVideo(e) {
    const f = e.target.files[0]
    if (!f) return
    setVideo(f)
  }

  async function uploadAll() {
    const urls = { main: '', extras: [], video: '' }

    if (mainImage) {
      const d = await uploadFile(api, mainImage)
      urls.main = d.url
    }
    if (video) {
      const d = await uploadFile(api, video)
      urls.video = d.url
    }
    if (extraImages.length > 0) {
      const form = new FormData()
      extraImages.forEach(f => form.append('files', f))
      const res = await api('/api/upload/multiple', { method: 'POST', body: form })
      if (res.ok) {
        const d = await res.json()
        urls.extras = d.files.map(f => f.url)
      }
    }
    return urls
  }

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !category) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return
    }
    setSaving(true)

    try {
      /* 1. Upload files first */
      setUploading(true)
      const urls = await uploadAll()
      setUploading(false)

      /* 2. Create product with media URLs */
      const body = {
        name_ar: name,
        category_slug: category,
        slug: name.replace(/\s+/g, '-'),
        featured: false,
        sort_order: 99,
        image: urls.main,
        video_url: urls.video,
      }

      const specs = parseSpecs(specsText)
      if (Object.keys(specs).length > 0) body.specs = specs
      if (description.trim()) body.description = description.trim()

      const r = await api('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error()
      const product = await r.json()

      /* 3. Add extra images */
      for (const url of urls.extras) {
        await api(`/api/products/${product.id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: url }),
        })
      }

      showToast('✅ تم إضافة المنتج بنجاح')
      navigate('/products')
    } catch (err) {
      console.error(err)
      showToast('فشل الإضافة', 'error')
      setSaving(false)
    }
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

        {/* ── Media section ── */}
        <section className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>الصور والفيديو</h3></div>
          <div className="card-body">
            <div className="form-grid">
              {/* Main image */}
              <div className="form-group">
                <label>الصورة الرئيسية</label>
                <input type="file" accept="image/*" onChange={onMainImage} />
                {mainPreview && (
                  <div style={{marginTop:8,position:'relative',display:'inline-block'}}>
                    <img src={mainPreview} alt="main" style={{width:160,height:120,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)'}} />
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="form-group">
                <label>فيديو المنتج</label>
                <input type="file" accept="video/*" onChange={onVideo} />
                {video && <p style={{marginTop:4,fontSize:12,color:'var(--text-secondary)'}}>✅ {video.name}</p>}
              </div>
            </div>

            {/* Extra images */}
            <div className="form-group" style={{marginTop:16}}>
              <label>صور إضافية (يمكن اختيار أكثر من صورة)</label>
              <input type="file" accept="image/*" multiple onChange={onExtraImages} />
              {extraPreviews.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                  {extraPreviews.map((url, i) => (
                    <div key={i} style={{position:'relative'}}>
                      <img src={url} alt={`extra ${i}`} style={{width:100,height:80,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)'}} />
                      <button type="button" onClick={() => removeExtraImage(i)}
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
              <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                {uploading ? 'جاري رفع الملفات…' : saving ? 'جاري الحفظ…' : 'حفظ المنتج'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
