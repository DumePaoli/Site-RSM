import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const { setAuth } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirectTo = params.get('redirect') || '/dashboard'
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await login({ email, password: pass })
      setAuth(r.token, r.customer)
      navigate(redirectTo)
    } catch (e) {
      setError(e.response?.data?.detail || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rust-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login.title', lang)}</h1>
          <p className="text-surface-400 text-sm mt-2">{t('login.sub', lang)}</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">{t('login.email', lang)}</label>
            <input type="email" className="input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('login.pass', lang)}</label>
            <input type="password" className="input" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? t('login.loading', lang) : t('login.btn', lang)}
          </button>
        </form>

        <p className="text-center text-surface-400 text-sm mt-6">
          {t('login.noAccount', lang)}{' '}
          <Link to="/register" className="text-rust-500 hover:underline">{t('login.register', lang)}</Link>
        </p>
        <p className="text-center text-surface-500 text-sm mt-2">
          <Link to="/forgot-password" className="hover:text-white transition-colors">Mot de passe oublié ?</Link>
        </p>
      </div>
    </div>
  )
}
