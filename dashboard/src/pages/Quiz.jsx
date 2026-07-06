import { useState, useEffect } from 'react'
import { useToast } from '../components/ToastContext'
import { apiErrorMessage } from '../utils/apiError'

/* Product recommendation profiles — each product scores on 4 axes */
const PROFILES = {
  'ماتور ديمى 9000 واحد حصان':     { usage: 'home', type: 'surface', power: 'medium', budget: 'medium', priority: 'quality' },
  'ماتور ديمى 300':                { usage: 'home', type: 'surface', power: 'small', budget: 'economy', priority: 'price' },
  'ماتور نصف حصان':                { usage: 'home', type: 'surface', power: 'small', budget: 'economy', priority: 'price' },
  'ماتور شمامة ٢ حصان':            { usage: 'both', type: 'surface', power: 'large', budget: 'medium', priority: 'quality' },
  'ماتور ميشيل متواضع الجديد':     { usage: 'home', type: 'surface', power: 'medium', budget: 'premium', priority: 'feature' },
  'ماتور مدفع ١.٥ حصان':          { usage: 'farm', type: 'surface', power: 'medium', budget: 'medium', priority: 'quality' },
  'ماتور مدفع ٣ حصان ٢ ريشة':      { usage: 'farm', type: 'surface', power: 'large', budget: 'premium', priority: 'feature' },
  'موتور زراعى ٢ حصان':            { usage: 'farm', type: 'surface', power: 'large', budget: 'medium', priority: 'quality' },
  'ماتور ١ حصان فارغة استانلس':    { usage: 'home', type: 'surface', power: 'medium', budget: 'premium', priority: 'quality' },
  'ماتور حركة ٥.٥ حصان سريع':     { usage: 'both', type: 'surface', power: 'large', budget: 'premium', priority: 'feature' },
  'ماتور حركة سريع + بطئ':         { usage: 'both', type: 'surface', power: 'medium', budget: 'premium', priority: 'feature' },
  'غاطس ديمى ١ حصان':             { usage: 'home', type: 'submersible', power: 'medium', budget: 'medium', priority: 'quality' },
  'غاطس ١.٥ حصان شارب':           { usage: 'both', type: 'submersible', power: 'medium', budget: 'medium', priority: 'quality' },
  'غاطس شارب ٢ حصان بمفرمة':       { usage: 'farm', type: 'submersible', power: 'large', budget: 'premium', priority: 'feature' },
  'فلوماك ديمى ٩٠٠٠':             { usage: 'both', type: 'flomax', power: 'medium', budget: 'medium', priority: 'price' },
  'فلوماك ديمى ٩٥٠٠ ديجيتال':     { usage: 'both', type: 'flomax', power: 'medium', budget: 'premium', priority: 'feature' },
  'بالونة مدورة ٢٤ لتر':           { usage: 'both', type: 'spare', power: 'small', budget: 'economy', priority: 'price' },
}

/* Fallback recommendations by usage+type (when scoring ties) */
const FALLBACK = {
  'home+surface': 'ماتور ديمى 9000 واحد حصان',
  'home+submersible': 'غاطس ديمى ١ حصان',
  'farm+surface': 'ماتور مدفع ٣ حصان ٢ ريشة',
  'farm+submersible': 'غاطس شارب ٢ حصان بمفرمة',
  'both+surface': 'ماتور شمامة ٢ حصان',
  'both+submersible': 'غاطس ١.٥ حصان شارب',
}

export default function Quiz() {
  const [step, setStep] = useState(1)
  const showToast = useToast()
  const [answers, setAnswers] = useState({})
  const [products, setProducts] = useState([])
  const [recommended, setRecommended] = useState(null)
  const [alternatives, setAlternatives] = useState([])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .catch(e => showToast(apiErrorMessage(e, 'فشل تحميل المنتجات'), 'error'))
  }, [])

  function handleAnswer(question, value) {
    const newAnswers = { ...answers, [question]: value }
    setAnswers(newAnswers)

    if (question === 'usage') { setStep(2); return }
    if (question === 'type') { setStep(3); return }
    if (question === 'power') { setStep(4); return }
    if (question === 'budget') {
      // Calculate best match
      const result = findBestMatch(newAnswers)
      setRecommended(result.best)
      setAlternatives(result.alts.slice(0, 3))
      setStep(5)
    }
  }

  function findBestMatch(answers) {
    let scored = products.map(p => {
      const profile = PROFILES[p.name]
      if (!profile) return { ...p, score: 0 }

      let score = 0
      if (profile.usage === answers.usage || profile.usage === 'both') score += 3
      if (profile.type === answers.type) score += 3
      if (profile.power === answers.power) score += 2
      if (profile.budget === answers.budget) score += 2

      // Bonus for priority match
      if (answers.budget === 'economy' && profile.priority === 'price') score += 1
      if (answers.budget === 'premium' && profile.priority === 'feature') score += 1

      return { ...p, score }
    })

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    // If no good match, use fallback
    if (!best || best.score === 0) {
      const key = (answers.usage || 'home') + '+' + (answers.type || 'surface')
      const name = FALLBACK[key] || 'ماتور ديمى 9000 واحد حصان'
      const fallbackProduct = products.find(p => p.name === name)
      return { best: fallbackProduct || { name, image: '', specs: {}, slug: '' }, alts: [] }
    }

    return { best, alts: scored.filter(p => p.score > 0 && p.name !== best.name) }
  }

  function reset() {
    setAnswers({}); setStep(1); setRecommended(null); setAlternatives([])
  }

  const btnStyle = { width:'100%',maxWidth:350,padding:'14px 20px',fontSize:15 }

  return (
    <>
      <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600,marginBottom:24}}>اختار ماتورك المناسب</h2>
      <p style={{color:'var(--muted)',fontSize:14,marginBottom:20}}>جاوب على ٤ أسئلة وهنحدد لك الأنسب بناءاً على احتياجك</p>

      <section className="card" style={{maxWidth:600,margin:'0 auto'}}>
        <div className="card-header">
          <h3>سؤال {step > 4 ? 4 : step} من ٤</h3>
          {step > 1 && <button className="btn btn-ghost btn-sm" onClick={() => { setStep(s => s - 1) }} style={{fontSize:12}}>← السابق</button>}
        </div>
        <div className="card-body" style={{padding:'28px 24px',textAlign:'center',minHeight:280}}>

          {/* Q1: USAGE */}
          {step === 1 && (
            <>
              <p style={{fontSize:16,fontWeight:700,marginBottom:8}}>١. الماتور هتستخدمه في إيه؟</p>
              <p style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>حدد نوع الاستخدام عشان نرشحلك الأنسب</p>
              {['home','farm','both'].map(opt => {
                const labels = { home: '🏠 منزلي (عمارة / فيلا)', farm: '🌾 زراعي (أرض / بئر)', both: '🏭 الاتنين مع بعض' }
                return <button key={opt} className="btn btn-secondary" style={btnStyle}
                  onClick={() => handleAnswer('usage', opt)}>{labels[opt]}</button>
              })}
            </>
          )}

          {/* Q2: TYPE */}
          {step === 2 && (
            <>
              <p style={{fontSize:16,fontWeight:700,marginBottom:8}}>٢. عاوز ماتور من النوع ده؟</p>
              <p style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>نوع الماتور اللي يناسب تركيبك</p>
              {[
                { value: 'surface', label: '🔧 موتور سطحى (فوق الأرض)' },
                { value: 'submersible', label: '💧 غاطس (جوه البئر)' },
                { value: 'flomax', label: '⚙️ فلوماك (تحكم ضغط)' },
                { value: 'spare', label: '🔩 قطع غيار' },
              ].map(opt => (
                <button key={opt.value} className="btn btn-secondary" style={btnStyle}
                  onClick={() => handleAnswer('type', opt.value)}>{opt.label}</button>
              ))}
            </>
          )}

          {/* Q3: POWER */}
          {step === 3 && (
            <>
              <p style={{fontSize:16,fontWeight:700,marginBottom:8}}>٣. عاوز قدرة كام؟</p>
              <p style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>القدرة المناسبة حسب احتياجك</p>
              {[
                { value: 'small', label: '🐟 صغير — أقل من ١ حصان (شقق / منازل صغيرة)' },
                { value: 'medium', label: '⚡ وسط — ١ إلى ٢ حصان (منازل / أدوار متعددة)' },
                { value: 'large', label: '💪 كبير — أكثر من ٢ حصان (أراضي / مزارع / عمارات)' },
              ].map(opt => (
                <button key={opt.value} className="btn btn-secondary" style={btnStyle}
                  onClick={() => handleAnswer('power', opt.value)}>{opt.label}</button>
              ))}
            </>
          )}

          {/* Q4: BUDGET */}
          {step === 4 && (
            <>
              <p style={{fontSize:16,fontWeight:700,marginBottom:8}}>٤. إيه الأهم بالنسبة لك؟</p>
              <p style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>حدد أولويتك عشان نرشحلك الأنسب</p>
              {[
                { value: 'economy', label: '💰 السعر الأقل — عاوز حاجة اقتصادية' },
                { value: 'medium', label: '⚖️ سعر معقول وجودة كويسة — الأفضل قيمة' },
                { value: 'premium', label: '🏆 الجودة والمواصفات — عاوز الأفضل بغض النظر عن السعر' },
              ].map(opt => (
                <button key={opt.value} className="btn btn-secondary" style={btnStyle}
                  onClick={() => handleAnswer('budget', opt.value)}>{opt.label}</button>
              ))}
            </>
          )}

          {/* RESULT */}
          {step === 5 && recommended && (
            <>
              <p style={{fontSize:16,fontWeight:700,marginBottom:4,color:'var(--success)'}}>✅ تم!</p>
              <p style={{fontSize:15,marginBottom:20}}>بناءاً على إجاباتك، نرشح لك:</p>

              <div style={{
                background:'var(--bg)', border:'2px solid var(--accent)',
                borderRadius:'var(--radius-lg)', padding:20, marginBottom:20,
                textAlign:'right', maxWidth:450, margin:'0 auto 20px'
              }}>
                <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                  <div style={{
                    width:90,height:90,borderRadius:'var(--radius)',
                    background:'var(--accent-soft)',display:'grid',placeItems:'center',
                    fontSize:32,flexShrink:0,color:'var(--accent)'
                  }}>⚙️</div>
                  <div style={{flex:1,minWidth:0}}>
                    <h4 style={{fontSize:17,fontWeight:700,marginBottom:6}}>{recommended.name}</h4>
                    <span style={{fontSize:12,color:'var(--muted)',display:'block',marginBottom:8}}>{recommended.category}</span>
                    {recommended.specs && Object.entries(recommended.specs).slice(0, 4).map(([k, v]) => (
                      <div key={k} style={{fontSize:13,padding:'3px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between'}}>
                        <span style={{color:'var(--muted)'}}>{k}</span>
                        <span style={{fontWeight:500}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <a href={'https://wa.me/201016892956?text=' + encodeURIComponent('أهلاً، أستفسر عن سعر ' + recommended.name)}
                 target="_blank" className="btn btn-primary"
                 style={{padding:'12px 24px',fontSize:15,display:'inline-flex',gap:8}}>
                💬 استفسر عن السعر عبر واتساب
              </a>

              {alternatives.length > 0 && (
                <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid var(--border)',textAlign:'right'}}>
                  <p style={{fontSize:13,fontWeight:600,marginBottom:12,color:'var(--muted)'}}>بدائل أخرى قد تناسبك:</p>
                  {alternatives.map((p, i) => (
                    <div key={i} style={{
                      display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13
                    }}>
                      <span>{p.name}</span>
                      <span style={{color:'var(--muted)',fontSize:12}}>{p.category}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{marginTop:20}}>
                <button className="btn btn-secondary btn-sm" onClick={reset} style={{padding:'8px 24px'}}>
                  🔄 ابدأ من جديد
                </button>
              </div>
            </>
          )}

        </div>
      </section>
    </>
  )
}
