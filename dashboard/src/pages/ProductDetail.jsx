import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { api } = useAuth()
  const [product, setProduct] = useState(null)

  useEffect(() => {
    api(`/api/products/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProduct)
      .catch(e => console.error('ProductDetail load error:', e))
  }, [slug])

  if (!product) {
    return <div className="empty-state"><div className="empty-icon">🔍</div><h3>جاري التحميل…</h3></div>
  }

  function go(path) {
    navigate(path)
  }

  const specKeys = Object.keys(product.specs || {})

  return (
    <>
      <div className="row-between" style={{marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600}}>تفاصيل المنتج</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary" onClick={() => go('/products')}>← العودة</button>
        </div>
      </div>

      <div className="prod-detail-header">
        <div className="prod-detail-image" style={{display:'grid',placeItems:'center',fontSize:64,color:'var(--accent)'}}>
          {product.image ? <img src={product.image.replace('../','/')} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}} /> : '⚙️'}
        </div>
        <div className="prod-detail-info">
          <h1>{product.name}</h1>
          <span className="prod-category" style={{fontSize:14}}>{product.category}</span>
          {product.featured && <span style={{fontSize:24}}>⭐ مميز</span>}

          {specKeys.length > 0 && (
            <div className="prod-detail-meta">
              {specKeys.map(key => (
                <div className="prod-meta-item" key={key}>
                  <span className="meta-label">{key}</span>
                  <span className="meta-value">{product.specs[key]}</span>
                </div>
              ))}
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="prod-detail-desc">
              <strong style={{display:'block',marginBottom:8}}>المواصفات الكاملة:</strong>
              <ul style={{listStyle:'none',padding:0}}>
                {product.features.map((f, i) => (
                  <li key={i} style={{padding:'4px 0',borderBottom:'1px solid var(--border)',fontSize:14}}>✓ {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{marginTop:20}}>
        <div className="card-header"><h3>إجراءات</h3></div>
        <div className="card-body" style={{display:'flex',flexWrap:'wrap',gap:12}}>
          <button className="btn btn-secondary" onClick={() => go('/products')}>📋 العودة للقائمة</button>
        </div>
      </div>
    </>
  )
}
