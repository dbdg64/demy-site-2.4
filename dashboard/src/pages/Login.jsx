import { useState } from 'react'
import './Login.css'
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


  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">د</div>
          <h1 className="login-title">ديمى</h1>
          <p className="login-subtitle">نظام إدارة المنتجات — لوحة التحكم</p>
        </div>

        {/* ── LOGIN SCREEN ── */}
        {screen === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group login-form-group">
              <label htmlFor="username">اسم المستخدم</label>
              <input id="username" type="text" className="form-input" placeholder="اسم المستخدم"
                     value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
            <div className="form-group login-form-group">
              <label htmlFor="password">كلمة المرور</label>
              <input id="password" type="password" className="form-input" placeholder="••••••"
                     value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <ErrorBox msg={error} />}
            {resetDone && <SuccessBox msg="تم reset" />}

            <button type="submit" className="btn btn-primary login-btn-full" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
            </button>

            <div className="login-link-wrap">
              <button type="button" className="login-link" onClick={() => { setScreen('forgot'); setError('') }}>
                نسيت كلمة المرور؟
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT: ENTER USERNAME ── */}
        {screen === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <h2 className="login-section-title">استعادة كلمة المرور</h2>
            <p className="login-section-desc">أدخل اسم المستخدم لاستعادة كلمة المرور</p>

            <div className="form-group login-form-group">
              <label htmlFor="forgotUser">اسم المستخدم</label>
              <input id="forgotUser" type="text" className="form-input" placeholder="اسم المستخدم"
                     value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="btn btn-primary login-btn-full">
              التالي
            </button>

            <div className="login-link-wrap">
              <button type="button" className="login-link-muted" onClick={backToLogin}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT: ANSWER SECURITY QUESTION ── */}
        {screen === 'answer' && forgotUser && (
          <form onSubmit={handleAnswerSubmit}>
            <h2 className="login-section-title">سؤال الأمان</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>المستخدم: <strong>{forgotUser.name}</strong></p>
            <p className="login-question-box">{forgotUser.securityQuestion}</p>

            <div className="form-group login-form-group">
              <label htmlFor="securityAnswer">الإجابة</label>
              <input id="securityAnswer" type="text" className="form-input" placeholder="أكتب إجابتك"
                     value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} autoFocus />
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="btn btn-primary login-btn-full">
              تحقق
            </button>

            <div className="login-link-wrap">
              <button type="button" className="login-link-muted" onClick={backToLogin}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT: RESET PASSWORD ── */}
        {screen === 'reset' && (
          <form onSubmit={handleResetSubmit}>
            <h2 className="login-section-title">إعادة تعيين كلمة المرور</h2>
            <p className="login-section-desc">أدخل كلمة مرور جديدة لـ <strong>{forgotUser?.name}</strong></p>

            <div className="form-group login-form-group">
              <label htmlFor="newPass">كلمة المرور الجديدة</label>
              <input id="newPass" type="password" className="form-input" placeholder="•••••• (٤ أحرف على الأقل)"
                     value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="btn btn-primary login-btn-full">
              حفظ كلمة المرور الجديدة
            </button>

            <div className="login-link-wrap">
              <button type="button" className="login-link-muted" onClick={backToLogin}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {resetDone && (
          <div className="login-reset-notice">
            <SuccessBox msg="✅ تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول." />
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ msg }) {
  return <div className="login-error-box">{msg}</div>
}

function SuccessBox({ msg }) {
  return <div className="login-success-box">{msg}</div>
}
