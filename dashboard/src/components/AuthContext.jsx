import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('demy_user')
    const storedToken = localStorage.getItem('demy_token')
    if (storedUser && storedToken) {
      try { setUser(JSON.parse(storedUser)); setToken(storedToken) } catch {}
    }
    setLoading(false)
  }, [])

  function login(username, password) {
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => {
      if (r.status === 429) return 'rate_limited'
      if (!r.ok) return false
      return r.json().then(data => {
        setUser(data)
        setToken(data.token)
        localStorage.setItem('demy_user', JSON.stringify(data))
        localStorage.setItem('demy_token', data.token)
        return true
      })
    }).catch(() => false)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('demy_user')
    localStorage.removeItem('demy_token')
  }

  function api(path, options = {}) {
    const headers = { ...(options.headers || {}) }
    if (token) headers['x-auth'] = token
    // Don't force JSON Content-Type for FormData (browser sets it with boundary)
    const isFormData = options.body instanceof FormData
    if (!headers['Content-Type'] && options.body && !isFormData) {
      headers['Content-Type'] = 'application/json'
    }
    // Remove Content-Type for FormData to let browser set multipart boundary
    if (isFormData) delete headers['Content-Type']
    return fetch(path, { ...options, headers })
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
