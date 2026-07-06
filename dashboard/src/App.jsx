import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductAdd from './pages/ProductAdd'
import ProductEdit from './pages/ProductEdit'
import ProductDetail from './pages/ProductDetail'
import Users from './pages/Users'
import Quiz from './pages/Quiz'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'var(--muted)'}}>جاري التحميل…</div>

  if (!user) return <Login />

  return (
    <div className="dash-shell">
      <DashboardLayout>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
          <Route path="/products/add" element={<ErrorBoundary><ProductAdd /></ErrorBoundary>} />
          <Route path="/products/edit/:slug" element={<ErrorBoundary><ProductEdit /></ErrorBoundary>} />
          <Route path="/products/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
          <Route path="/users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
          <Route path="/quiz" element={<ErrorBoundary><Quiz /></ErrorBoundary>} />
        </Routes>
      </DashboardLayout>
    </div>
  )
}
function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function navTo(path) {
    navigate(path)
  }
  function activeClass(path) {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <>
      <aside className="sidebar" data-od-id="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">د</div>
          <div>
            <div className="logo-text">ديمى</div>
            <div className="logo-sub">منتجات المياه</div>
          </div>
        </div>
        <nav className="sidebar-nav" data-od-id="sidebar-nav">
          <ul>
            <li><span className="section-label">عام</span></li>
            <li>
              <a href="/dashboard" onClick={e => { e.preventDefault(); navTo('/dashboard') }} className={activeClass('/dashboard')}>
                <GridIcon /> <span className="nav-label">لوحة التحكم</span>
              </a>
            </li>
            <li>
              <a href="/products" onClick={e => { e.preventDefault(); navTo('/products') }} className={activeClass('/products')}>
                <BoxIcon /> <span className="nav-label">المنتجات</span>
              </a>
            </li>
            <li>
              <a href="/products/add" onClick={e => { e.preventDefault(); navTo('/products/add') }} className={activeClass('/products/add')}>
                <PlusIcon /> <span className="nav-label">إضافة منتج</span>
              </a>
            </li>
            {user?.role === 'مدير' && (
              <li>
                <span className="section-label">الإدارة</span>
              </li>
            )}
            {user?.role === 'مدير' && (
              <li>
                <a href="/users" onClick={e => { e.preventDefault(); navTo('/users') }} className={activeClass('/users')}>
                  <UsersIcon /> <span className="nav-label">المستخدمين</span>
                </a>
              </li>
            )}
          </ul>
          <ul style={{marginTop:8}}>
            <li><span className="section-label">مساعد</span></li>
            <li>
              <a href="/quiz" onClick={e => { e.preventDefault(); navTo('/quiz') }} className={activeClass('/quiz')}>
                <QuizIcon /> <span className="nav-label">اختار ماتورك</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:'var(--radius)',marginBottom:8,background:'rgba(255,255,255,0.06)'}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'var(--accent-soft)',display:'grid',placeItems:'center',fontSize:12,fontWeight:600,color:'var(--accent)',flexShrink:0}}>
              {user?.name?.charAt(0) || 'أ'}
            </div>
            <div style={{fontSize:12,flex:1,minWidth:0}}>
              <div style={{fontWeight:500,color:'rgba(255,255,255,0.9)',fontSize:13}}>{user?.name || 'أحمد'}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{user?.role || 'مدير'}</div>
            </div>
          </div>
          <button onClick={() => { if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) logout() }} style={{
            display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:'var(--radius)',
            color:'rgba(255,255,255,0.6)',fontSize:13,width:'100%',background:'none',border:'none',cursor:'pointer',
            transition:'all 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'none' }}>
            <LogoutIcon />
            <span className="nav-label">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar" data-od-id="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              <span>لوحة التحكم</span>
              <span className="current">{pageTitle()}</span>
            </div>
          </div>
          <div className="topbar-right">
            <span style={{fontSize:13,color:'var(--muted)'}}>مرحباً، {user?.name || 'أحمد'}</span>
            <div style={{width:34,height:34,borderRadius:'50%',background:'var(--accent-soft)',display:'grid',placeItems:'center',fontWeight:600,fontSize:14,color:'var(--accent)'}}>
              {user?.name?.charAt(0) || 'أ'}
            </div>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </>
  )
  function pageTitle() {
    const titles = { '/dashboard': 'نظرة عامة', '/products': 'المنتجات', '/products/add': 'إضافة منتج', '/users': 'المستخدمين', '/quiz': 'اختار ماتورك' }
    return titles[location.pathname] || ''
  }
}

function GridIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
}
function BoxIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
}
function QuizIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
}

function UsersIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
}

function PlusIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
}
function LogoutIcon() {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
}
