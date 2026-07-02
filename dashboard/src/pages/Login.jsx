import { useState } from 'react'
import { useAuth } from '../components/AuthContext'

export default function Login() {
  const { login } = useAuth()

  // Screen: 'login' | 'forgot' | 'answer' | 'reset'
  const [screen, setScreen] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password flow
  const [forgotUser, setForgotUser] = useState(null)
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetDone, setResetDone] = useState(false)

  function handleLogin(e) {
    e.preventDefault(); setError('')
    if (!username || !password) { setError('الرجاء إدخال اسم المستخدم وكلمة المرور'); return }
    setLoading(true)
    login(username, password).then(result => {
      if (result === 'rate_limited') setError('محاولات كثيرة جداً. حاول بعد ١٥ دقيقة.')
      else if (!result) setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      setLoading(false)
    })
  }

  function handleForgotSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    if (!username) { setError('الرجاء إدخال اسم المستخدم'); setLoading(false); return }
    fetch('/api/auth/forgot', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username}) })
      .then(r => r.json().then(d => ({ok:r.ok, ...d})))
      .then(d => {
        if (!d.ok) { setError(d.error || 'اسم المستخدم غير موجود'); setLoading(false); return }
        setForgotUser(d)
        setSecurityAnswer('')
        setScreen('answer')
        setLoading(false)
      })
      .catch(() => { setError('حدث خطأ'); setLoading(false) })
  }

  function handleAnswerSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    if (!securityAnswer.trim()) { setError('الرجاء إدخال الإجابة'); setLoading(false); return }
    fetch('/api/auth/verify-answer', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:forgotUser.username, answer:securityAnswer}) })
      .then(r => r.json().then(d => ({ok:r.ok, ...d})))
      .then(d => {
        if (!d.ok) { setError(d.error || 'الإجابة غير صحيحة'); setLoading(false); return }
        setNewPassword('')
        setScreen('reset')
        setLoading(false)
      })
      .catch(() => { setError('حدث خطأ'); setLoading(false) })
  }

  function handleResetSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    if (newPassword.length < 4) { setError('كلمة المرور يجب أن تكون ٤ أحرف على الأقل'); setLoading(false); return }
    fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:forgotUser.username, newPassword}) })
      .then(r => r.json().then(d => ({ok:r.ok, ...d})))
      .then(d => {
        if (!d.ok) { setError(d.error || 'فشل إعادة التعيين'); setLoading(false); return }
        setResetDone(true)
        setScreen('login')
        setError('')
        setLoading(false)
        setTimeout(() => setResetDone(false), 3000)
      })
      .catch(() => { setError('حدث خطأ'); setLoading(false) })
  }

  function backToLogin() {
    setScreen('login'); setError(''); setForgotUser(null); setResetDone(false)
  }

  const inputStyle = { marginBottom: 16 }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 40, width: '100%', maxWidth: 400,
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--accent)', borderRadius: 12,
            display: 'grid', placeItems: 'center', margin: '0 auto 12px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--fg)'
          }}>د</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ديمى</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>نظام إدارة المنتجات — لوحة التحكم</p>
        </div>

        {/* ── LOGIN SCREEN ── */}
        {screen === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={inputStyle}>
              <label htmlFor="username">اسم المستخدم</label>
              <input id="username" type="text" className="form-input" placeholder="اسم المستخدم"
                     value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
            <div className="form-group" style={inputStyle}>
              <label htmlFor="password">كلمة المرور</label>
              <input id="password" type="password" className="form-input" placeholder="••••••"
                     value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <ErrorBox msg={error} />}
            {resetDone && <SuccessBox msg="تم reset" />}

            <button type="submit" className="btn btn-primary" disabled={loading}
                    style={{ width: '100%', padding: 12, fontSize: 15, justifyContent: 'center' }}>
              {loading ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={() => { setScreen('forgot'); setError('') }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                نسيت كلمة المرور؟
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT: ENTER USERNAME ── */}
        {screen === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>استعادة كلمة المرور</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>أدخل اسم المستخدم لاستعادة كلمة المرور</p>

            <div className="form-group" style={inputStyle}>
              <label htmlFor="forgotUser">اسم المستخدم</label>
              <input id="forgotUser" type="text" className="form-input" placeholder="اسم المستخدم"
                     value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="btn btn-primary"
                    style={{ width: '100%', padding: 12, fontSize: 15, justifyContent: 'center' }}>
              التالي
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={backToLogin}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT: ANSWER SECURITY QUESTION ── */}
        {screen === 'answer' && forgotUser && (
          <form onSubmit={handleAnswerSubmit}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>سؤال الأمان</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>المستخدم: <strong>{forgotUser.name}</strong></p>
            <p style={{ color: 'var(--fg)', fontSize: 15, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-warm)', borderRadius: 'var(--radius)' }}>
              {forgotUser.securityQuestion}
            </p>

            <div className="form-group" style={inputStyle}>
              <label htmlFor="securityAnswer">الإجابة</label>
              <input id="securityAnswer" type="text" className="form-input" placeholder="أكتب إجابتك"
                     value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} autoFocus />
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="btn btn-primary"
                    style={{ width: '100%', padding: 12, fontSize: 15, justifyContent: 'center' }}>
              تحقق
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={backToLogin}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT: RESET PASSWORD ── */}
        {screen === 'reset' && (
          <form onSubmit={handleResetSubmit}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>إعادة تعيين كلمة المرور</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              أدخل كلمة مرور جديدة لـ <strong>{forgotUser?.name}</strong>
            </p>

            <div className="form-group" style={inputStyle}>
              <label htmlFor="newPass">كلمة المرور الجديدة</label>
              <input id="newPass" type="password" className="form-input" placeholder="•••••• (٤ أحرف على الأقل)"
                     value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="btn btn-primary"
                    style={{ width: '100%', padding: 12, fontSize: 15, justifyContent: 'center' }}>
              حفظ كلمة المرور الجديدة
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={backToLogin}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {resetDone && (
          <div style={{ marginTop: 16 }}>
            <SuccessBox msg="✅ تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول." />
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ msg }) {
  return <div style={{
    background: 'color-mix(in oklch, var(--danger) 10%, transparent)',
    color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius)',
    fontSize: 13, marginBottom: 16, textAlign: 'center'
  }}>{msg}</div>
}

function SuccessBox({ msg }) {
  return <div style={{
    background: 'color-mix(in oklch, var(--success) 10%, transparent)',
    color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius)',
    fontSize: 13, marginBottom: 16, textAlign: 'center'
  }}>{msg}</div>
}
